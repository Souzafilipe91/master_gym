import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { achievements } from "../drizzle/schema.ts";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

await db.insert(achievements).values([
  { code: "first_workout",    name: "Primeiro Passo",       description: "Complete seu primeiro treino",               icon: "Dumbbell",   category: "milestone",  requirement: 1,   points: 10 },
  { code: "ten_workouts",     name: "Maratonista",          description: "Complete 10 treinos",                        icon: "Target",     category: "milestone",  requirement: 10,  points: 25 },
  { code: "fifty_workouts",   name: "Veterano",             description: "Complete 50 treinos",                        icon: "Award",      category: "milestone",  requirement: 50,  points: 50 },
  { code: "hundred_workouts", name: "Lenda",                description: "Complete 100 treinos",                       icon: "Trophy",     category: "milestone",  requirement: 100, points: 100 },
  { code: "week_streak",      name: "Semana Perfeita",      description: "Treine 7 dias consecutivos",                 icon: "Calendar",   category: "streak",     requirement: 7,   points: 30 },
  { code: "month_workouts",   name: "Mês Completo",         description: "20 ou mais treinos em um mês",               icon: "Flame",      category: "frequency",  requirement: 20,  points: 50 },
  { code: "pr_first",         name: "Novo Recorde!",        description: "Bata seu primeiro Personal Record",          icon: "TrendingUp", category: "pr",         requirement: 1,   points: 15 },
  { code: "pr_ten",           name: "Máquina de PRs",       description: "Bata 10 Personal Records",                  icon: "Zap",        category: "pr",         requirement: 10,  points: 40 },
  { code: "frequency_4week",  name: "Constância",           description: "Treine pelo menos 4x por semana durante 4 semanas", icon: "Star", category: "frequency", requirement: 4,  points: 35 },
]);

console.log("✅ 9 conquistas inseridas!");
await pool.end();
