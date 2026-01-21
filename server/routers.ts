import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { updateUserWeight } from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  user: router({
    updateWeight: protectedProcedure
      .input(z.object({ weight: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        await updateUserWeight(ctx.user.id, input.weight);
        return { success: true };
      }),
  }),

  // Ciclos
  cycles: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllCycles();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCycleById(input.id);
      }),
  }),

  // Tipos de Treino
  workoutTypes: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllWorkoutTypes();
    }),
    getByCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        return await db.getWorkoutTypeByCode(input.code);
      }),
  }),

  // Grupos Musculares
  muscleGroups: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllMuscleGroups();
    }),
  }),

  // Exercícios
  exercises: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllExercises();
    }),
    getByMuscleGroup: publicProcedure
      .input(z.object({ muscleGroupId: z.number() }))
      .query(async ({ input }) => {
        return await db.getExercisesByMuscleGroup(input.muscleGroupId);
      }),
  }),

  // Exercícios do Treino
  workoutExercises: router({
    getByCycleAndType: publicProcedure
      .input(z.object({ 
        cycleId: z.number(), 
        workoutTypeId: z.number() 
      }))
      .query(async ({ input }) => {
        return await db.getWorkoutExercises(input.cycleId, input.workoutTypeId);
      }),
  }),

  // Logs de Treino
  workoutLogs: router({
    getMyLogs: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserWorkoutLogs(ctx.user.id, input?.limit);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getWorkoutLogById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        workoutTypeId: z.number(),
        cycleId: z.number(),
        workoutDate: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createWorkoutLog({
          userId: ctx.user.id,
          workoutTypeId: input.workoutTypeId,
          cycleId: input.cycleId,
          workoutDate: new Date(input.workoutDate),
          completed: false,
          notes: input.notes,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        completed: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateWorkoutLog(id, data);
        return { success: true };
      }),
  }),

  // Logs de Exercício
  exerciseLogs: router({
    getByWorkoutLog: protectedProcedure
      .input(z.object({ workoutLogId: z.number() }))
      .query(async ({ input }) => {
        return await db.getExerciseLogsByWorkoutLog(input.workoutLogId);
      }),
    create: protectedProcedure
      .input(z.object({
        workoutLogId: z.number(),
        exerciseId: z.number(),
        setNumber: z.number(),
        reps: z.number(),
        load: z.string(),
        completed: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createExerciseLog(input);
      }),
  }),

  // Logs de Peso
  weightLogs: router({
    getMyLogs: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserWeightLogs(ctx.user.id, input?.limit);
      }),
    create: protectedProcedure
      .input(z.object({
        weight: z.string(),
        logDate: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Atualizar peso atual do usuário
        await db.updateUserWeight(ctx.user.id, parseFloat(input.weight));
        // Criar log de peso
        return await db.createWeightLog({
          userId: ctx.user.id,
          weight: input.weight,
          logDate: new Date(input.logDate),
          notes: input.notes,
        });
      }),
  }),

  // Recomendações de Cardio
  cardio: router({
    getRecommendation: publicProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCardioRecommendationByCycle(input.cycleId);
      }),
    getMyLogs: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserCardioLogs(ctx.user.id, input?.limit);
      }),
    createLog: protectedProcedure
      .input(z.object({
        cardioDate: z.string(),
        duration: z.number(),
        type: z.string(),
        intensity: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createCardioLog({
          userId: ctx.user.id,
          cardioDate: new Date(input.cardioDate),
          duration: input.duration,
          type: input.type,
          intensity: input.intensity,
          notes: input.notes,
        });
      }),
  }),

  // Anamnese
  anamnese: router({
    getMy: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAnamneseByUserId(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        age: z.number().optional(),
        height: z.string().optional(),
        currentWeight: z.string().optional(),
        targetWeight: z.string().optional(),
        gender: z.string().optional(),
        primaryGoal: z.string().optional(),
        secondaryGoals: z.string().optional(),
        trainingExperience: z.string().optional(),
        currentTrainingFrequency: z.string().optional(),
        previousInjuries: z.string().optional(),
        medicalRestrictions: z.string().optional(),
        exerciseRestrictions: z.string().optional(),
        availableDays: z.string().optional(),
        sessionDuration: z.string().optional(),
        occupation: z.string().optional(),
        activityLevel: z.string().optional(),
        sleepHours: z.string().optional(),
        stressLevel: z.string().optional(),
        dietType: z.string().optional(),
        supplementation: z.string().optional(),
        chest: z.string().optional(),
        waist: z.string().optional(),
        hips: z.string().optional(),
        thigh: z.string().optional(),
        arm: z.string().optional(),
        bodyFat: z.string().optional(),
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createAnamnese({
          userId: ctx.user.id,
          ...input,
        });
      }),
    generateWorkout: protectedProcedure
      .input(z.object({
        anamneseId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Buscar anamnese do usuário
        const anamnese = await db.getAnamneseByUserId(ctx.user.id);
        if (!anamnese) {
          throw new Error("Anamnese não encontrada. Por favor, preencha sua anamnese primeiro.");
        }

        // Importar função de LLM
        const { invokeLLM } = await import("./_core/llm");

        // Preparar prompt com dados da anamnese
        const prompt = `Você é um personal trainer especializado com anos de experiência. Analise a anamnese abaixo e crie um programa de treino personalizado.

DADOS DO ALUNO:
- Idade: ${anamnese.age} anos
- Gênero: ${anamnese.gender}
- Altura: ${anamnese.height} cm
- Peso Atual: ${anamnese.currentWeight} kg
- Peso Alvo: ${anamnese.targetWeight} kg
- % Gordura: ${anamnese.bodyFat}%

OBJETIVOS:
- Principal: ${anamnese.primaryGoal}
- Secundários: ${anamnese.secondaryGoals}

EXPERIÊNCIA E HISTÓRICO:
- Experiência: ${anamnese.trainingExperience}
- Frequência atual: ${anamnese.currentTrainingFrequency}
- Lesões anteriores: ${anamnese.previousInjuries || "Nenhuma"}

RESTRIÇÕES:
- Médicas: ${anamnese.medicalRestrictions || "Nenhuma"}
- Exercícios a evitar: ${anamnese.exerciseRestrictions || "Nenhum"}

DISPONIBILIDADE:
- Dias disponíveis: ${anamnese.availableDays}
- Duração da sessão: ${anamnese.sessionDuration}

ESTILO DE VIDA:
- Ocupação: ${anamnese.occupation}
- Nível de atividade: ${anamnese.activityLevel}
- Horas de sono: ${anamnese.sleepHours}
- Nível de estresse: ${anamnese.stressLevel}

NUTRIÇÃO:
- Tipo de dieta: ${anamnese.dietType}
- Suplementação: ${anamnese.supplementation}

OBSERVAÇÕES:
${anamnese.additionalNotes || "Nenhuma"}

Crie um programa de treino completo e personalizado seguindo estas diretrizes:

1. Divida o treino em 4 sessões (A, B, C, D) considerando os dias disponíveis
2. Para cada treino, especifique:
   - Nome do treino e grupos musculares trabalhados
   - Lista de exercícios (8-12 por treino)
   - Para cada exercício: nome, séries, repetições, carga inicial sugerida, tempo de descanso
   - Técnicas avançadas quando aplicável (drop set, rest-pause, etc)
3. Inclua recomendações de cardio (frequência, duração, intensidade)
4. Sugira progressão de carga (quanto aumentar e quando)
5. Dê dicas específicas baseadas nas restrições e objetivos

Formate a resposta em Markdown com seções claras e bem organizadas.`;

        // Chamar LLM
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um personal trainer especializado e experiente. Crie programas de treino personalizados, detalhados e seguros baseados na anamnese do aluno." },
            { role: "user", content: prompt },
          ],
        });

        const workoutPlan = response.choices[0]?.message?.content || "Erro ao gerar treino";

        return {
          success: true,
          workoutPlan,
          anamnese,
        };
      }),
  }),

  // Profile
  profile: router({
    updateWeight: protectedProcedure
      .input(z.object({ weight: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserWeight(ctx.user.id, input.weight);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
