import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, cycles, workoutTypes, muscleGroups, exercises, 
  workoutExercises, workoutLogs, exerciseLogs, weightLogs, 
  cardioRecommendations, cardioLogs, anamneses, InsertAnamnese,
  achievements, userAchievements, savedAiWorkouts, InsertSavedAiWorkout
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
  
  // Verificar conquistas após criar log de treino
  if (data.userId) {
    try {
      await checkAndUnlockAchievements(data.userId);
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
      // Não bloquear o salvamento do treino se houver erro nas conquistas
    }
  }
  
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

export async function getLastExerciseLog(userId: number, exerciseId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const logs = await db
    .select({
      reps: exerciseLogs.reps,
      load: exerciseLogs.load,
      workoutDate: workoutLogs.workoutDate,
    })
    .from(exerciseLogs)
    .innerJoin(workoutLogs, eq(exerciseLogs.workoutLogId, workoutLogs.id))
    .where(and(
      eq(workoutLogs.userId, userId),
      eq(exerciseLogs.exerciseId, exerciseId),
      eq(workoutLogs.completed, true)
    ))
    .orderBy(desc(workoutLogs.workoutDate))
    .limit(1);
  
  return logs[0] || null;
}

export async function getRecentExerciseLogs(userId: number, exerciseId: number, limit: number = 3) {
  const db = await getDb();
  if (!db) return [];
  
  const logs = await db
    .select({
      reps: exerciseLogs.reps,
      load: exerciseLogs.load,
      workoutDate: workoutLogs.workoutDate,
    })
    .from(exerciseLogs)
    .innerJoin(workoutLogs, eq(exerciseLogs.workoutLogId, workoutLogs.id))
    .where(and(
      eq(workoutLogs.userId, userId),
      eq(exerciseLogs.exerciseId, exerciseId),
      eq(workoutLogs.completed, true)
    ))
    .orderBy(desc(workoutLogs.workoutDate))
    .limit(limit);
  
  return logs;
}

export async function getExerciseLogsByExercise(userId: number, exerciseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const logs = await db
    .select({
      reps: exerciseLogs.reps,
      weight: exerciseLogs.load,
      workoutDate: workoutLogs.workoutDate,
    })
    .from(exerciseLogs)
    .innerJoin(workoutLogs, eq(exerciseLogs.workoutLogId, workoutLogs.id))
    .where(and(
      eq(workoutLogs.userId, userId),
      eq(exerciseLogs.exerciseId, exerciseId),
      eq(workoutLogs.completed, true)
    ))
    .orderBy(workoutLogs.workoutDate);
  
  return logs;
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

export async function updateUserWeight(userId: number, weight: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ currentWeight: weight.toString() }).where(eq(users.id, userId));
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
  if (!db) return null;
  
  const result = await db.select().from(anamneses).where(eq(anamneses.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createAnamnese(data: InsertAnamnese) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(anamneses).values(data);
  return result;
}

// Achievements
export async function getAllAchievements() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(achievements).orderBy(achievements.category, achievements.points);
}

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: userAchievements.id,
    userId: userAchievements.userId,
    achievementId: userAchievements.achievementId,
    unlockedAt: userAchievements.unlockedAt,
    progress: userAchievements.progress,
    name: achievements.name,
    description: achievements.description,
    icon: achievements.icon,
    category: achievements.category,
    requirement: achievements.requirement,
    points: achievements.points,
  })
  .from(userAchievements)
  .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
  .where(eq(userAchievements.userId, userId));
}

export async function unlockAchievement(userId: number, achievementId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já foi desbloqueada
  const existing = await db.select().from(userAchievements)
    .where(and(
      eq(userAchievements.userId, userId),
      eq(userAchievements.achievementId, achievementId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  const result = await db.insert(userAchievements).values({
    userId,
    achievementId,
    progress: 100,
  });
  return result;
}


// ─── Treinos IA Salvos ───────────────────────────────────────────────────────

export async function saveAiWorkout(data: InsertSavedAiWorkout) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(savedAiWorkouts).values(data);
  return result;
}

export async function getSavedAiWorkouts(userId: number, type?: "calistenia" | "copied") {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(savedAiWorkouts.userId, userId)];
  if (type) conditions.push(eq(savedAiWorkouts.type, type));
  return await db.select().from(savedAiWorkouts)
    .where(and(...conditions))
    .orderBy(desc(savedAiWorkouts.createdAt));
}

export async function getSavedAiWorkoutById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(savedAiWorkouts)
    .where(and(eq(savedAiWorkouts.id, id), eq(savedAiWorkouts.userId, userId)))
    .limit(1);
  return result[0] || null;
}

export async function deleteSavedAiWorkout(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(savedAiWorkouts)
    .where(and(eq(savedAiWorkouts.id, id), eq(savedAiWorkouts.userId, userId)));
}

// Verificar e desbloquear conquistas automaticamente
export async function checkAndUnlockAchievements(userId: number) {
  const db = await getDb();
  if (!db) return;

  // Buscar todas as conquistas
  const allAchievements = await db.select().from(achievements);
  
  // Buscar conquistas já desbloqueadas
  const unlockedAchievements = await db.select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  
  const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId));

  // Buscar estatísticas do usuário
  const workoutCount = await db.select({ count: sql<number>`count(*)` })
    .from(workoutLogs)
    .where(and(
      eq(workoutLogs.userId, userId),
      eq(workoutLogs.completed, true)
    ));
  
  const totalWorkouts = Number(workoutCount[0]?.count || 0);

  // Verificar cada conquista
  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue; // Já desbloqueada

    let shouldUnlock = false;

    switch (achievement.category) {
      case 'milestone':
        // Conquistas baseadas em número de treinos
        if (achievement.code.includes('workout')) {
          shouldUnlock = totalWorkouts >= achievement.requirement;
        }
        break;
      
      case 'frequency':
        // Conquistas de frequência (implementar lógica específica depois)
        break;
      
      case 'pr':
        // Conquistas de recordes pessoais (implementar depois)
        break;
      
      case 'streak':
        // Conquistas de sequências (implementar depois)
        break;
    }

    if (shouldUnlock) {
      await unlockAchievement(userId, achievement.id);
    }
  }
}
