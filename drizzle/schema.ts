import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  currentWeight: decimal("currentWeight", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Ciclos do programa anual (4 ciclos de 12 semanas cada)
 */
export const cycles = mysqlTable("cycles", {
  id: int("id").autoincrement().primaryKey(),
  cycleNumber: int("cycleNumber").notNull(), // 1, 2, 3, 4
  name: varchar("name", { length: 255 }).notNull(),
  startWeek: int("startWeek").notNull(),
  endWeek: int("endWeek").notNull(),
  objective: text("objective").notNull(),
  focus: varchar("focus", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Cycle = typeof cycles.$inferSelect;
export type InsertCycle = typeof cycles.$inferInsert;

/**
 * Tipos de treino (A, B, C, D)
 */
export const workoutTypes = mysqlTable("workout_types", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(), // A, B, C, D
  name: varchar("name", { length: 255 }).notNull(),
  duration: int("duration").notNull(), // em minutos
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkoutType = typeof workoutTypes.$inferSelect;
export type InsertWorkoutType = typeof workoutTypes.$inferInsert;

/**
 * Grupos musculares
 */
export const muscleGroups = mysqlTable("muscle_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MuscleGroup = typeof muscleGroups.$inferSelect;
export type InsertMuscleGroup = typeof muscleGroups.$inferInsert;

/**
 * Biblioteca de exercícios
 */
export const exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  muscleGroupId: int("muscleGroupId").notNull(),
  description: text("description"),
  videoUrl: varchar("videoUrl", { length: 512 }),
  imageUrl: varchar("imageUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;

/**
 * Exercícios do treino (template de exercícios para cada tipo de treino em cada ciclo)
 */
export const workoutExercises = mysqlTable("workout_exercises", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  workoutTypeId: int("workoutTypeId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  orderIndex: int("orderIndex").notNull(), // ordem do exercício no treino
  sets: int("sets").notNull(),
  reps: varchar("reps", { length: 100 }).notNull(), // ex: "3x10-12 + 1x4+4+4"
  initialLoad: decimal("initialLoad", { precision: 6, scale: 2 }).notNull(),
  loadProgression: decimal("loadProgression", { precision: 5, scale: 2 }).notNull(), // kg a adicionar a cada progressão
  technique: varchar("technique", { length: 255 }), // ex: "Cluster set", "Drop set"
  restTime: varchar("restTime", { length: 50 }), // ex: "90s", "2 min"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type InsertWorkoutExercise = typeof workoutExercises.$inferInsert;

/**
 * Registro de treinos realizados pelo usuário
 */
export const workoutLogs = mysqlTable("workout_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workoutTypeId: int("workoutTypeId").notNull(),
  cycleId: int("cycleId").notNull(),
  workoutDate: date("workoutDate").notNull(),
  completed: boolean("completed").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = typeof workoutLogs.$inferInsert;

/**
 * Registro de exercícios realizados em cada treino
 */
export const exerciseLogs = mysqlTable("exercise_logs", {
  id: int("id").autoincrement().primaryKey(),
  workoutLogId: int("workoutLogId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  setNumber: int("setNumber").notNull(), // número da série (1, 2, 3, etc)
  reps: int("reps").notNull(), // repetições executadas
  load: decimal("load", { precision: 6, scale: 2 }).notNull(), // carga utilizada
  completed: boolean("completed").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type InsertExerciseLog = typeof exerciseLogs.$inferInsert;

/**
 * Histórico de peso corporal do usuário
 */
export const weightLogs = mysqlTable("weight_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(),
  logDate: date("logDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeightLog = typeof weightLogs.$inferSelect;
export type InsertWeightLog = typeof weightLogs.$inferInsert;

/**
 * Recomendações de cardio por ciclo
 */
export const cardioRecommendations = mysqlTable("cardio_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  frequency: varchar("frequency", { length: 100 }).notNull(), // ex: "4x na semana"
  duration: varchar("duration", { length: 100 }).notNull(), // ex: "30 minutos"
  intensity: varchar("intensity", { length: 100 }).notNull(), // ex: "Baixa (LISS)"
  timing: varchar("timing", { length: 255 }), // ex: "Em jejum ou após treinos"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CardioRecommendation = typeof cardioRecommendations.$inferSelect;
export type InsertCardioRecommendation = typeof cardioRecommendations.$inferInsert;

/**
 * Registro de sessões de cardio realizadas
 */
export const cardioLogs = mysqlTable("cardio_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cardioDate: date("cardioDate").notNull(),
  duration: int("duration").notNull(), // em minutos
  type: varchar("type", { length: 100 }).notNull(), // ex: "LISS", "HIIT", "Corrida", "Bicicleta"
  intensity: varchar("intensity", { length: 50 }), // ex: "Baixa", "Moderada", "Alta"
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CardioLog = typeof cardioLogs.$inferSelect;
export type InsertCardioLog = typeof cardioLogs.$inferInsert;
