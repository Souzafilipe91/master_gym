import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
        await db.updateUserWeight(ctx.user.id, input.weight);
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

  // Profile
  profile: router({
    updateWeight: protectedProcedure
      .input(z.object({ weight: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserWeight(ctx.user.id, input.weight);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
