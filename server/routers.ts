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
    getLastLog: protectedProcedure
      .input(z.object({ exerciseId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getLastExerciseLog(ctx.user.id, input.exerciseId);
      }),
    getByExercise: protectedProcedure
      .input(z.object({ exerciseId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.getExerciseLogsByExercise(ctx.user.id, input.exerciseId);
      }),
    getRecentLogs: protectedProcedure
      .input(z.object({ exerciseId: z.number(), limit: z.number().default(3) }))
      .query(async ({ input, ctx }) => {
        return await db.getRecentExerciseLogs(ctx.user.id, input.exerciseId, input.limit);
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

  // Treinos IA Salvos
  savedWorkouts: router({
    save: protectedProcedure
      .input(z.object({
        type: z.enum(["calistenia", "copied"]),
        title: z.string().min(1),
        content: z.string().min(1),
        athleteName: z.string().optional(),
        videoUrl: z.string().optional(),
        videoAnalysis: z.string().optional(),
        focus: z.string().optional(),
        duration: z.number().optional(),
        difficulty: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.saveAiWorkout({ userId: ctx.user.id, ...input });
        return { success: true };
      }),
    getAll: protectedProcedure
      .input(z.object({ type: z.enum(["calistenia", "copied"]).optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getSavedAiWorkouts(ctx.user.id, input.type);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteSavedAiWorkout(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Calistenia — treinos em casa gerados por IA
  calistenia: router({
    generate: protectedProcedure
      .input(z.object({
        focus: z.string().optional(), // ex: "peito", "pernas", "full body"
        duration: z.number().optional(), // minutos disponíveis
        difficulty: z.enum(["iniciante", "intermediario", "avancado"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const anamnese = await db.getAnamneseByUserId(ctx.user.id);
        if (!anamnese) {
          throw new Error("Preencha sua anamnese antes de gerar um treino de calistenia.");
        }

        const { invokeLLM } = await import("./_core/llm");

        const focusText = input.focus ? `Foco do treino: ${input.focus}` : "Treino full body";
        const durationText = input.duration ? `${input.duration} minutos` : anamnese.sessionDuration || "60 minutos";
        const difficultyText = input.difficulty || (anamnese.trainingExperience?.toLowerCase().includes("iniciante") ? "iniciante" : "intermediario");

        const prompt = `Você é um especialista em calistenia e treino funcional. Crie um treino de calistenia completo para ser feito EM CASA, sem equipamentos (ou com itens básicos como barra de porta e elástico).

DADOS DO ALUNO:
- Idade: ${anamnese.age} anos
- Gênero: ${anamnese.gender}
- Peso: ${anamnese.currentWeight} kg
- Objetivo principal: ${anamnese.primaryGoal}
- Experiência: ${anamnese.trainingExperience}
- Lesões/restrições: ${anamnese.previousInjuries || "Nenhuma"}
- Restrições médicas: ${anamnese.medicalRestrictions || "Nenhuma"}
- Exercícios a evitar: ${anamnese.exerciseRestrictions || "Nenhum"}

PARÂMETROS DO TREINO:
- ${focusText}
- Duração: ${durationText}
- Nível de dificuldade: ${difficultyText}

Crie um treino de calistenia detalhado com:
1. Nome do treino e objetivo
2. Aquecimento (5-10 min): 3-4 exercícios com duração/repetições
3. Bloco principal (${durationText}): 6-10 exercícios organizados em blocos ou circuitos
   - Para cada exercício: nome, séries/repetições ou tempo, descanso, descrição da execução correta
   - Variações mais fáceis e mais difíceis de cada exercício
4. Desaquecimento/alongamento (5 min)
5. Dicas de progressão: como avançar o treino nas próximas semanas
6. Frequência recomendada por semana

Formate em Markdown com seções claras. Use emojis para deixar mais visual e motivador.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um especialista em calistenia, treino funcional e bodyweight training. Crie treinos seguros, progressivos e adaptados ao nível do aluno." },
            { role: "user", content: prompt },
          ],
        });

        return {
          success: true,
          workoutPlan: response.choices[0]?.message?.content || "Erro ao gerar treino",
          params: { focus: input.focus, duration: input.duration, difficulty: difficultyText },
        };
      }),
  }),

  // Copiar Treino — analisa vídeo de rotina de atleta e adapta à anamnese
  copiarTreino: router({
    fromVideo: protectedProcedure
      .input(z.object({
        videoUrl: z.string().url(),
        athleteName: z.string().optional(),
        additionalContext: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const anamnese = await db.getAnamneseByUserId(ctx.user.id);
        if (!anamnese) {
          throw new Error("Preencha sua anamnese antes de copiar um treino.");
        }

        const { invokeLLM } = await import("./_core/llm");

        // Primeiro: analisar o vídeo para extrair a rotina de treino
        const videoAnalysisResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um especialista em análise de treinos de atletas e fisiculturistas. Sua tarefa é extrair informações detalhadas sobre rotinas de treino a partir de vídeos."
            },
            {
              role: "user",
              content: [
                {
                  type: "text" as const,
                  text: `Analise este vídeo de treino${input.athleteName ? ` do(a) ${input.athleteName}` : ""} e extraia:
1. Todos os exercícios realizados (nome, séries, repetições, carga se visível)
2. Grupos musculares trabalhados
3. Ordem dos exercícios
4. Técnicas especiais utilizadas (drop set, super set, etc)
5. Tempo de descanso estimado
6. Intensidade geral do treino
7. Qualquer dica ou observação relevante mencionada

Contexto adicional: ${input.additionalContext || "Nenhum"}

Formate a análise de forma estruturada e detalhada.`
                },
                {
                  type: "file_url" as const,
                  file_url: {
                    url: input.videoUrl,
                    mime_type: "video/mp4" as const
                  }
                }
              ]
            }
          ],
        });

        const videoAnalysis = videoAnalysisResponse.choices[0]?.message?.content || "";

        // Segundo: adaptar o treino extraído à anamnese do usuário
        const adaptationPrompt = `Você é um personal trainer experiente. Analise a rotina de treino extraída de um vídeo e adapte-a para o aluno abaixo, respeitando suas limitações e objetivos.

ROTINA ORIGINAL EXTRAÍDA DO VÍDEO:
${videoAnalysis}

DADOS DO ALUNO:
- Idade: ${anamnese.age} anos
- Gênero: ${anamnese.gender}
- Peso: ${anamnese.currentWeight} kg
- Objetivo principal: ${anamnese.primaryGoal}
- Experiência: ${anamnese.trainingExperience}
- Lesões/restrições: ${anamnese.previousInjuries || "Nenhuma"}
- Restrições médicas: ${anamnese.medicalRestrictions || "Nenhuma"}
- Exercícios a evitar: ${anamnese.exerciseRestrictions || "Nenhum"}
- Duração disponível: ${anamnese.sessionDuration || "60 minutos"}
- Nível de atividade: ${anamnese.activityLevel}

Crie uma versão adaptada da rotina que:
1. Mantenha a essência e estrutura do treino original
2. Substitua exercícios inadequados por alternativas seguras para o aluno
3. Ajuste volume (séries/repetições) ao nível de experiência
4. Ajuste cargas iniciais sugeridas ao perfil do aluno
5. Indique quais exercícios foram mantidos, modificados ou substituídos e por quê
6. Adicione progressão sugerida para as próximas 4 semanas

Formate em Markdown com:
- Seção "Análise do Treino Original" (resumo do que foi extraído)
- Seção "Treino Adaptado" (versão personalizada)
- Seção "Modificações Realizadas" (o que mudou e por quê)
- Seção "Progressão Sugerida" (como evoluir)

Use emojis para tornar mais visual.`;

        const adaptationResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um personal trainer especializado em adaptar treinos de atletas de alto nível para praticantes comuns, respeitando limitações individuais." },
            { role: "user", content: adaptationPrompt },
          ],
        });

        return {
          success: true,
          videoAnalysis,
          adaptedWorkout: adaptationResponse.choices[0]?.message?.content || "Erro ao adaptar treino",
          athleteName: input.athleteName,
          videoUrl: input.videoUrl,
        };
      }),
  }),

  // Achievements
  achievements: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllAchievements();
    }),
    getMy: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAchievements(ctx.user.id);
    }),
    unlock: protectedProcedure
      .input(z.object({ achievementId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.unlockAchievement(ctx.user.id, input.achievementId);
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
