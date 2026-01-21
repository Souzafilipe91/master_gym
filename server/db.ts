import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, cycles, workoutTypes, muscleGroups, exercises, 
  workoutExercises, workoutLogs, exerciseLogs, weightLogs, 
  cardioRecommendations, cardioLogs, anamneses, InsertAnamnese
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.currentWeight !== undefined) {
      values.currentWeight = user.currentWeight;
      updateSet.currentWeight = user.currentWeight;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Cycles
export async function getAllCycles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cycles).orderBy(asc(cycles.cycleNumber));
}

export async function getCycleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cycles).where(eq(cycles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Workout Types
export async function getAllWorkoutTypes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workoutTypes).orderBy(asc(workoutTypes.code));
}

export async function getWorkoutTypeByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workoutTypes).where(eq(workoutTypes.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Muscle Groups
export async function getAllMuscleGroups() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(muscleGroups).orderBy(asc(muscleGroups.name));
}

// Exercises
export async function getAllExercises() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(exercises).orderBy(asc(exercises.name));
}

export async function getExercisesByMuscleGroup(muscleGroupId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(exercises).where(eq(exercises.muscleGroupId, muscleGroupId)).orderBy(asc(exercises.name));
}

// Workout Exercises
export async function getWorkoutExercises(cycleId: number, workoutTypeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(workoutExercises)
    .where(and(eq(workoutExercises.cycleId, cycleId), eq(workoutExercises.workoutTypeId, workoutTypeId)))
    .orderBy(asc(workoutExercises.orderIndex));
}

// Workout Logs
export async function getUserWorkoutLogs(userId: number, limit?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(workoutLogs).where(eq(workoutLogs.userId, userId)).orderBy(desc(workoutLogs.workoutDate));
  if (limit) {
    return await query.limit(limit);
  }
  return await query;
}

export async function getWorkoutLogById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workoutLogs).where(eq(workoutLogs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createWorkoutLog(data: typeof workoutLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workoutLogs).values(data);
  return result;
}

export async function updateWorkoutLog(id: number, data: Partial<typeof workoutLogs.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workoutLogs).set(data).where(eq(workoutLogs.id, id));
}

// Exercise Logs
export async function getExerciseLogsByWorkoutLog(workoutLogId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(exerciseLogs).where(eq(exerciseLogs.workoutLogId, workoutLogId)).orderBy(asc(exerciseLogs.setNumber));
}

export async function createExerciseLog(data: typeof exerciseLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(exerciseLogs).values(data);
  return result;
}

// Weight Logs
export async function getUserWeightLogs(userId: number, limit?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(weightLogs).where(eq(weightLogs.userId, userId)).orderBy(desc(weightLogs.logDate));
  if (limit) {
    return await query.limit(limit);
  }
  return await query;
}

export async function createWeightLog(data: typeof weightLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(weightLogs).values(data);
  return result;
}

export async function updateUserWeight(userId: number, weight: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ currentWeight: weight }).where(eq(users.id, userId));
}

// Cardio Recommendations
export async function getCardioRecommendationByCycle(cycleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cardioRecommendations).where(eq(cardioRecommendations.cycleId, cycleId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Cardio Logs
export async function getUserCardioLogs(userId: number, limit?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(cardioLogs).where(eq(cardioLogs.userId, userId)).orderBy(desc(cardioLogs.cardioDate));
  if (limit) {
    return await query.limit(limit);
  }
  return await query;
}

export async function createCardioLog(data: typeof cardioLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cardioLogs).values(data);
  return result;
}

// Anamnese
export async function getAnamneseByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(anamneses).where(eq(anamneses.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAnamnese(data: InsertAnamnese) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(anamneses).values(data);
  return result;
}
