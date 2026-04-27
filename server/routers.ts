import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { updateUserWeight } from "./db";
import { invokeLLM } from "./_core/llm";

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

Crie um programa de treino completo e personalizado. IMPORTANTE: para cada exercício, use EXATAMENTE este formato:

### N. Nome do Exercício
**Séries:** X | **Reps:** Y-Z | **Descanso:** Xs
**Execução:** Descrição detalhada de como executar o exercício corretamente, incluindo posicionamento, movimento, pegada e respiração.
**Dica:** Observação técnica importante ou técnica avançada quando aplicável.

Estrutura do programa:
1. Título do programa com # (ex: # Programa de Musculação Personalizado)
2. Divisão em 4 sessões (A, B, C, D) com ## para cada sessão
3. Para cada sessão: grupos musculares trabalhados e 8-12 exercícios no formato acima
4. Seção "## Cardio" com recomendações
5. Seção "## Progressão de Carga" com orientações

Não use tabelas, apenas o formato de cabeçalho ### para cada exercício. Formate em Markdown com seções claras.`;

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
        type: z.enum(["calistenia", "copied", "musculacao"]),
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
        const saved = await db.saveAiWorkout({ userId: ctx.user.id, ...input });
        return { success: true, id: saved.id };
      }),
    getAll: protectedProcedure
      .input(z.object({ type: z.enum(["calistenia", "copied", "musculacao"]).optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getSavedAiWorkouts(ctx.user.id, input.type);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getSavedAiWorkoutById(input.id, ctx.user.id);
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

Crie um treino de calistenia detalhado. IMPORTANTE: use EXATAMENTE o formato abaixo para cada exercício:

### N. Nome do Exercício
**Séries:** X | **Reps:** Y-Z | **Descanso:** Xs
**Execução:** Descrição detalhada de como executar o exercício corretamente, incluindo posicionamento do corpo, movimento e respiração.
**Dica:** Observação importante ou variação mais fácil/difícil.

Estrutura do treino:
1. Título do treino com # (ex: # Treino de Calistenia Full Body)
2. Aquecimento (5-10 min): 3-4 exercícios no formato acima
3. Bloco principal (${durationText}): 6-10 exercícios no formato acima
4. Desaquecimento/alongamento (5 min): 2-3 exercícios no formato acima
5. Dicas de progressão para as próximas semanas

Use emojis para deixar mais visual e motivador. Não use tabelas, apenas o formato de cabeçalho ### para cada exercício.`;

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

Crie uma versão adaptada da rotina. IMPORTANTE: para cada exercício do treino adaptado, use EXATAMENTE este formato:

### N. Nome do Exercício
**Séries:** X | **Reps:** Y-Z | **Descanso:** Xs
**Execução:** Descrição detalhada de como executar o exercício corretamente, incluindo posicionamento, movimento e respiração.
**Dica:** Observação ou modificação feita em relação ao original.

Estrutura da resposta:
1. Título do treino com # (ex: # Treino Adaptado - [Nome do Atleta])
2. Seção "## Análise do Treino Original" (resumo breve)
3. Seção "## Treino Adaptado" com todos os exercícios no formato acima
4. Seção "## Modificações" (o que mudou e por quê)
5. Seção "## Progressão Sugerida" (como evoluir nas próximas 4 semanas)

Não use tabelas, apenas o formato de cabeçalho ### para cada exercício. Use emojis para tornar mais visual.`;

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
  // Dietas IA
  diets: router({
    generate: protectedProcedure
      .input(z.object({
        objective: z.enum(["bulking", "cutting", "manutencao", "recomposicao"]),
        weight: z.string(),
        height: z.string(),
        age: z.number(),
        gender: z.string(),
        activityLevel: z.string(),
        restrictions: z.string().optional(),
        preferences: z.string().optional(),
        mealsPerDay: z.number().min(3).max(7).default(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const objectiveLabels: Record<string, string> = {
          bulking: "Ganho de Massa Muscular (Bulking)",
          cutting: "Perda de Gordura (Cutting)",
          manutencao: "Manutenção do Peso",
          recomposicao: "Recomposição Corporal",
        };
        const activityLabels: Record<string, string> = {
          sedentario: "Sedentário (sem exercício)",
          leve: "Levemente ativo (1-2x/semana)",
          moderado: "Moderadamente ativo (3-4x/semana)",
          ativo: "Muito ativo (5-6x/semana)",
          muito_ativo: "Extremamente ativo (2x/dia)",
        };
        const prompt = `Crie um plano alimentar completo e detalhado para:

**Dados do usuário:**
- Objetivo: ${objectiveLabels[input.objective] || input.objective}
- Peso: ${input.weight}kg
- Altura: ${input.height}cm
- Idade: ${input.age} anos
- Gênero: ${input.gender}
- Nível de atividade: ${activityLabels[input.activityLevel] || input.activityLevel}
- Restrições alimentares: ${input.restrictions || "Nenhuma"}
- Preferências: ${input.preferences || "Nenhuma"}
- Refeições por dia: ${input.mealsPerDay}

IMPORTANTE: Use EXATAMENTE este formato para cada refeição:

## Refeição N: [Nome da Refeição] ([Horário sugerido])
**Macros:** Proteína: Xg | Carboidratos: Xg | Gordura: Xg | Calorias: X kcal

### Alimentos:
- [Alimento]: [quantidade] - [preparo/observação]
- [Alimento]: [quantidade]

**Dica:** Observação importante sobre esta refeição.

Estrutura completa da resposta:
1. Título com # (ex: # Plano Alimentar - [Objetivo])
2. Seção "## Resumo Nutricional" com total de calorias, proteína, carboidratos e gordura diários
3. Seção "## Distribuição das Refeições" com cada refeição no formato acima
4. Seção "## Orientações Gerais" com dicas de hidratação, suplementação e comportamento alimentar
5. Seção "## Substituições" com opções para trocar alimentos principais

Use emojis para tornar mais visual. Seja prático e objetivo.`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um nutricionista esportivo especializado em planos alimentares para praticantes de musculação. Gere planos detalhados, práticos e baseados em alimentos acessíveis no Brasil." },
            { role: "user", content: prompt },
          ],
        });
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "";
        // Extrair macros totais do conteúdo
        const caloriesMatch = content.match(/Total.*?(\d{3,4})\s*kcal/i) || content.match(/(\d{3,4})\s*kcal.*?total/i);
        const proteinMatch = content.match(/Prote[ií]na.*?(\d{2,3})g/i);
        const carbsMatch = content.match(/Carboidratos.*?(\d{2,3})g/i);
        const fatMatch = content.match(/Gordura.*?(\d{2,3})g/i);
        const title = `Dieta ${objectiveLabels[input.objective]} - ${new Date().toLocaleDateString("pt-BR")}`;
        const saved = await db.saveDiet({
          userId: ctx.user.id,
          title,
          objective: input.objective,
          content,
          weight: input.weight,
          height: input.height,
          age: input.age,
          gender: input.gender,
          activityLevel: input.activityLevel,
          restrictions: input.restrictions,
          preferences: input.preferences,
          targetCalories: caloriesMatch ? parseInt(caloriesMatch[1]) : null,
          targetProtein: proteinMatch ? parseInt(proteinMatch[1]) : null,
          targetCarbs: carbsMatch ? parseInt(carbsMatch[1]) : null,
          targetFat: fatMatch ? parseInt(fatMatch[1]) : null,
        });
        return { success: true, content, insertId: (saved as any).insertId };
      }),
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDietsByUser(ctx.user.id);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const diet = await db.getDietById(input.id);
        if (!diet || diet.userId !== ctx.user.id) return null;
        return diet;
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteDiet(input.id, ctx.user.id);
        return { success: true };
      }),
    getLatest: protectedProcedure.query(async ({ ctx }) => {
      return await db.getLatestDiet(ctx.user.id);
    }),
  }),
});
export type AppRouter = typeof appRouter;
