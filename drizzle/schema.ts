import {
  boolean,
  date,
  decimal,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 10 }).notNull().default("user"),
  currentWeight: decimal("currentWeight", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const anamneses = pgTable("anamneses", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  age: integer("age"),
  height: varchar("height", { length: 10 }),
  currentWeight: varchar("currentWeight", { length: 10 }),
  targetWeight: varchar("targetWeight", { length: 10 }),
  gender: varchar("gender", { length: 20 }),
  primaryGoal: text("primaryGoal"),
  secondaryGoals: text("secondaryGoals"),
  trainingExperience: text("trainingExperience"),
  currentTrainingFrequency: varchar("currentTrainingFrequency", { length: 50 }),
  previousInjuries: text("previousInjuries"),
  medicalRestrictions: text("medicalRestrictions"),
  exerciseRestrictions: text("exerciseRestrictions"),
  availableDays: text("availableDays"),
  sessionDuration: varchar("sessionDuration", { length: 50 }),
  occupation: varchar("occupation", { length: 100 }),
  activityLevel: varchar("activityLevel", { length: 50 }),
  sleepHours: varchar("sleepHours", { length: 20 }),
  stressLevel: varchar("stressLevel", { length: 20 }),
  dietType: varchar("dietType", { length: 50 }),
  supplementation: text("supplementation"),
  chest: varchar("chest", { length: 10 }),
  waist: varchar("waist", { length: 10 }),
  hips: varchar("hips", { length: 10 }),
  thigh: varchar("thigh", { length: 10 }),
  arm: varchar("arm", { length: 10 }),
  bodyFat: varchar("bodyFat", { length: 10 }),
  additionalNotes: text("additionalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Anamnese = typeof anamneses.$inferSelect;
export type InsertAnamnese = typeof anamneses.$inferInsert;

export const cycles = pgTable("cycles", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycleNumber").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  startWeek: integer("startWeek").notNull(),
  endWeek: integer("endWeek").notNull(),
  objective: text("objective").notNull(),
  focus: varchar("focus", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Cycle = typeof cycles.$inferSelect;
export type InsertCycle = typeof cycles.$inferInsert;

export const workoutTypes = pgTable("workout_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  duration: integer("duration").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WorkoutType = typeof workoutTypes.$inferSelect;
export type InsertWorkoutType = typeof workoutTypes.$inferInsert;

export const muscleGroups = pgTable("muscle_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MuscleGroup = typeof muscleGroups.$inferSelect;
export type InsertMuscleGroup = typeof muscleGroups.$inferInsert;

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  muscleGroupId: integer("muscleGroupId").notNull(),
  description: text("description"),
  videoUrl: varchar("videoUrl", { length: 512 }),
  imageUrl: varchar("imageUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;

export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycleId").notNull(),
  workoutTypeId: integer("workoutTypeId").notNull(),
  exerciseId: integer("exerciseId").notNull(),
  orderIndex: integer("orderIndex").notNull(),
  sets: integer("sets").notNull(),
  reps: varchar("reps", { length: 100 }).notNull(),
  initialLoad: decimal("initialLoad", { precision: 6, scale: 2 }).notNull(),
  loadProgression: decimal("loadProgression", { precision: 5, scale: 2 }).notNull(),
  technique: varchar("technique", { length: 255 }),
  restTime: varchar("restTime", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type InsertWorkoutExercise = typeof workoutExercises.$inferInsert;

export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  workoutTypeId: integer("workoutTypeId").notNull(),
  cycleId: integer("cycleId").notNull(),
  workoutDate: date("workoutDate").notNull(),
  completed: boolean("completed").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = typeof workoutLogs.$inferInsert;

export const exerciseLogs = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  workoutLogId: integer("workoutLogId").notNull(),
  exerciseId: integer("exerciseId").notNull(),
  setNumber: integer("setNumber").notNull(),
  reps: integer("reps").notNull(),
  load: decimal("load", { precision: 6, scale: 2 }).notNull(),
  completed: boolean("completed").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type InsertExerciseLog = typeof exerciseLogs.$inferInsert;

export const weightLogs = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(),
  logDate: date("logDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WeightLog = typeof weightLogs.$inferSelect;
export type InsertWeightLog = typeof weightLogs.$inferInsert;

export const cardioRecommendations = pgTable("cardio_recommendations", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycleId").notNull(),
  frequency: varchar("frequency", { length: 100 }).notNull(),
  duration: varchar("duration", { length: 100 }).notNull(),
  intensity: varchar("intensity", { length: 100 }).notNull(),
  timing: varchar("timing", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CardioRecommendation = typeof cardioRecommendations.$inferSelect;
export type InsertCardioRecommendation = typeof cardioRecommendations.$inferInsert;

export const cardioLogs = pgTable("cardio_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  cardioDate: date("cardioDate").notNull(),
  duration: integer("duration").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  intensity: varchar("intensity", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CardioLog = typeof cardioLogs.$inferSelect;
export type InsertCardioLog = typeof cardioLogs.$inferInsert;

export const achievementCategoryEnum = pgEnum("achievement_category", [
  "frequency",
  "milestone",
  "pr",
  "streak",
]);

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  category: achievementCategoryEnum("category").notNull(),
  requirement: integer("requirement").notNull(),
  points: integer("points").notNull().default(10),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  achievementId: integer("achievementId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  progress: integer("progress").default(0),
});
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  workoutLogId: integer("workoutLogId").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  duration: integer("duration"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = typeof workoutSessions.$inferInsert;

export const savedAiWorkoutTypeEnum = pgEnum("saved_ai_workout_type", [
  "calistenia",
  "copied",
  "musculacao",
]);

export const savedAiWorkouts = pgTable("saved_ai_workouts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: savedAiWorkoutTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  athleteName: varchar("athleteName", { length: 255 }),
  videoUrl: varchar("videoUrl", { length: 512 }),
  videoAnalysis: text("videoAnalysis"),
  focus: varchar("focus", { length: 100 }),
  duration: integer("duration"),
  difficulty: varchar("difficulty", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SavedAiWorkout = typeof savedAiWorkouts.$inferSelect;
export type InsertSavedAiWorkout = typeof savedAiWorkouts.$inferInsert;

export const dietObjectiveEnum = pgEnum("diet_objective", [
  "bulking",
  "cutting",
  "manutencao",
  "recomposicao",
]);

export const savedDiets = pgTable("saved_diets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  objective: dietObjectiveEnum("objective").notNull(),
  content: text("content").notNull(),
  weight: varchar("weight", { length: 10 }),
  height: varchar("height", { length: 10 }),
  age: integer("age"),
  gender: varchar("gender", { length: 20 }),
  activityLevel: varchar("activityLevel", { length: 50 }),
  restrictions: text("restrictions"),
  preferences: text("preferences"),
  targetCalories: integer("targetCalories"),
  targetProtein: integer("targetProtein"),
  targetCarbs: integer("targetCarbs"),
  targetFat: integer("targetFat"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SavedDiet = typeof savedDiets.$inferSelect;
export type InsertSavedDiet = typeof savedDiets.$inferInsert;

export const mealEnum = pgEnum("meal_type", [
  "cafe_manha",
  "lanche_manha",
  "almoco",
  "lanche_tarde",
  "jantar",
  "ceia",
]);

export const foodLogs = pgTable("food_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  meal: mealEnum("meal").notNull().default("almoco"),
  name: varchar("name", { length: 255 }).notNull(),
  calories: integer("calories").notNull().default(0),
  protein: decimal("protein", { precision: 6, scale: 1 }).notNull().default("0"),
  carbs: decimal("carbs", { precision: 6, scale: 1 }).notNull().default("0"),
  fat: decimal("fat", { precision: 6, scale: 1 }).notNull().default("0"),
  quantity: varchar("quantity", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FoodLog = typeof foodLogs.$inferSelect;
export type InsertFoodLog = typeof foodLogs.$inferInsert;
