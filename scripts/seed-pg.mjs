import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import {
  cycles, workoutTypes, muscleGroups, exercises,
  workoutExercises, cardioRecommendations
} from "../drizzle/schema.ts";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("🌱 Iniciando seed do banco...");

  // 1. Ciclos
  console.log("📅 Inserindo ciclos...");
  await db.insert(cycles).values([
    { cycleNumber: 1, name: "CICLO 1: HIPERTROFIA COM FORÇA", startWeek: 1, endWeek: 12, objective: "Ganho de massa muscular com aumento de força", focus: "Volume e Progressão Linear", description: "Semanas 1-12 (Jan-Mar 2026)" },
    { cycleNumber: 2, name: "CICLO 2: HIPERTROFIA MÁXIMA", startWeek: 13, endWeek: 24, objective: "Máximo ganho de massa muscular", focus: "Volume Alto e Técnicas Avançadas", description: "Semanas 13-24 (Abr-Jun 2026)" },
    { cycleNumber: 3, name: "CICLO 3: FORÇA E DEFINIÇÃO", startWeek: 25, endWeek: 36, objective: "Ganho de força com manutenção de definição", focus: "Força e Densidade Muscular", description: "Semanas 25-36 (Jul-Set 2026)" },
    { cycleNumber: 4, name: "CICLO 4: DEFINIÇÃO COM FORÇA", startWeek: 37, endWeek: 52, objective: "Ganho de definição mantendo força", focus: "Definição e Manutenção", description: "Semanas 37-52 (Out-Dez 2026)" },
  ]);

  // 2. Tipos de Treino
  console.log("💪 Inserindo tipos de treino...");
  await db.insert(workoutTypes).values([
    { code: "A", name: "Peito e Tríceps", duration: 70, description: "Treino focado em peitoral e tríceps" },
    { code: "B", name: "Costas e Bíceps", duration: 70, description: "Treino focado em costas e bíceps" },
    { code: "C", name: "Membros Inferiores", duration: 75, description: "Treino focado em pernas e panturrilhas" },
    { code: "D", name: "Ombro, Trapézio e Abdome", duration: 70, description: "Treino focado em ombros, trapézio e abdômen" },
  ]);

  // 3. Grupos Musculares
  console.log("🎯 Inserindo grupos musculares...");
  await db.insert(muscleGroups).values([
    { name: "Peito" },
    { name: "Costas" },
    { name: "Pernas" },
    { name: "Ombro" },
    { name: "Bíceps" },
    { name: "Tríceps" },
    { name: "Abdômen" },
    { name: "Trapézio" },
    { name: "Panturrilha" },
  ]);

  // 4. Exercícios (IDs 1-48 em ordem de inserção)
  console.log("🏋️ Inserindo exercícios...");
  await db.insert(exercises).values([
    // Peito (muscleGroupId: 1) → IDs 1-7
    { name: "Supino Reto com Halter", muscleGroupId: 1 },
    { name: "Supino Inclinado com Halter", muscleGroupId: 1 },
    { name: "Voador", muscleGroupId: 1 },
    { name: "Chest Press", muscleGroupId: 1 },
    { name: "Crucifixo com Halteres", muscleGroupId: 1 },
    { name: "Cross Over Polia Alta", muscleGroupId: 1 },
    { name: "Crucifixo Inclinado", muscleGroupId: 1 },
    // Costas (muscleGroupId: 2) → IDs 8-14
    { name: "Puxador Costas Frente Pegada Aberta", muscleGroupId: 2 },
    { name: "Puxador Costas Frente Triângulo", muscleGroupId: 2 },
    { name: "Remada Articulada Pronada", muscleGroupId: 2 },
    { name: "Remada Baixa Triângulo", muscleGroupId: 2 },
    { name: "Crucifixo Inverso na Máquina", muscleGroupId: 2 },
    { name: "Barra Fixa", muscleGroupId: 2 },
    { name: "Remada Curvada", muscleGroupId: 2 },
    // Pernas (muscleGroupId: 3) → IDs 15-22
    { name: "Agachamento Hack", muscleGroupId: 3 },
    { name: "Leg Press 45°", muscleGroupId: 3 },
    { name: "Cadeira Extensora", muscleGroupId: 3 },
    { name: "Mesa Flexora", muscleGroupId: 3 },
    { name: "Cadeira Flexora", muscleGroupId: 3 },
    { name: "Cadeira Abdutora", muscleGroupId: 3 },
    { name: "Leg Press Unilateral", muscleGroupId: 3 },
    { name: "Agachamento Livre", muscleGroupId: 3 },
    // Ombro (muscleGroupId: 4) → IDs 23-28
    { name: "Desenvolvimento Máquina Simultâneo", muscleGroupId: 4 },
    { name: "Desenvolvimento Arnold", muscleGroupId: 4 },
    { name: "Elevação Lateral", muscleGroupId: 4 },
    { name: "Elevação Lateral Unilateral no Cross", muscleGroupId: 4 },
    { name: "Desenvolvimento com Halteres", muscleGroupId: 4 },
    { name: "Elevação Frontal", muscleGroupId: 4 },
    // Bíceps (muscleGroupId: 5) → IDs 29-33
    { name: "Rosca Alternada com Rotação", muscleGroupId: 5 },
    { name: "Rosca Direta Cross", muscleGroupId: 5 },
    { name: "Rosca Martelo", muscleGroupId: 5 },
    { name: "Rosca Direta Barra Reta", muscleGroupId: 5 },
    { name: "Rosca Concentrada", muscleGroupId: 5 },
    // Tríceps (muscleGroupId: 6) → IDs 34-38
    { name: "Tríceps Pulley Barra Reta", muscleGroupId: 6 },
    { name: "Tríceps Francês Corda no Cross", muscleGroupId: 6 },
    { name: "Tríceps Testa com Halter", muscleGroupId: 6 },
    { name: "Tríceps Coice", muscleGroupId: 6 },
    { name: "Mergulho", muscleGroupId: 6 },
    // Abdômen (muscleGroupId: 7) → IDs 39-42 (mas seed original usa 41-44 como abdomen)
    // Vou manter a sequência para que os workoutExercises batam com os IDs corretos
    // O seed original referencia: exerciseId 36,37,38 (tríceps), 41,42 (abdômen), 45,46 (trapézio), 47 (panturrilha)
    // Contando: 7 peito + 7 costas + 8 pernas + 6 ombro + 5 bíceps + 5 tríceps = 38 até aqui
    // Abdômen (IDs 39-42)
    { name: "Abdômen no Solo", muscleGroupId: 7 },        // 39
    { name: "Abdominal Declinado", muscleGroupId: 7 },    // 40
    { name: "Abdominal Infra", muscleGroupId: 7 },        // 41
    { name: "Prancha", muscleGroupId: 7 },                // 42
    // Trapézio (IDs 43-44)  — seed original usa 45,46
    // Preciso de 2 exercícios "dummy" para manter IDs
    { name: "Elevação de Ombro Frontal", muscleGroupId: 4 }, // 43 (dummy)
    { name: "Remada Alta", muscleGroupId: 4 },               // 44 (dummy)
    // Trapézio reais (IDs 45-46)
    { name: "Encolhimento com Halter", muscleGroupId: 8 },   // 45
    { name: "Encolhimento na Máquina", muscleGroupId: 8 },   // 46
    // Panturrilha (IDs 47-48)
    { name: "Panturrilha Sentado", muscleGroupId: 9 },        // 47
    { name: "Panturrilha em Pé", muscleGroupId: 9 },          // 48
  ]);

  // 5. Exercícios dos Treinos (Ciclo 1)
  console.log("📋 Inserindo exercícios do treino (Ciclo 1)...");
  await db.insert(workoutExercises).values([
    // Treino A - Peito e Tríceps
    { cycleId: 1, workoutTypeId: 1, exerciseId: 1,  orderIndex: 1, sets: 6, reps: "2x12 / 2x10 / 2x8",       initialLoad: "45.00", loadProgression: "2.50", technique: "Aquecimento + Progressão", restTime: "90s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 2,  orderIndex: 2, sets: 5, reps: "1x12 / 2x10 / 2x8",       initialLoad: "40.00", loadProgression: "2.50", technique: "Progressão de carga",      restTime: "90s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 3,  orderIndex: 3, sets: 4, reps: "3x10-12 + 1x4+4+4",       initialLoad: "20.00", loadProgression: "2.50", technique: "Cluster set",              restTime: "75s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 4,  orderIndex: 4, sets: 4, reps: "3x10-12 + 1x4+4+4",       initialLoad: "100.00",loadProgression: "5.00", technique: "Cluster set",              restTime: "75s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 5,  orderIndex: 5, sets: 3, reps: "3x12-15",                  initialLoad: "15.00", loadProgression: "1.00", technique: "Novo exercício",           restTime: "60s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 36, orderIndex: 6, sets: 5, reps: "4x10+falha + 1x15",        initialLoad: "50.00", loadProgression: "2.50", technique: "Drop set + Back off",     restTime: "60s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 37, orderIndex: 7, sets: 4, reps: "4x10-12",                  initialLoad: "35.00", loadProgression: "2.50", technique: "Padrão",                  restTime: "60s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 38, orderIndex: 8, sets: 4, reps: "4x10-12",                  initialLoad: "18.00", loadProgression: "1.00", technique: "Padrão",                  restTime: "60s" },
    // Treino B - Costas e Bíceps
    { cycleId: 1, workoutTypeId: 2, exerciseId: 8,  orderIndex: 1, sets: 6, reps: "2x12 / 2x10 / 2x8",       initialLoad: "80.00", loadProgression: "2.50", technique: "Aquecimento + Progressão", restTime: "90s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 9,  orderIndex: 2, sets: 5, reps: "4x10-12 + 1x4+4+4",       initialLoad: "85.00", loadProgression: "2.50", technique: "Cluster set",              restTime: "75s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 10, orderIndex: 3, sets: 4, reps: "4x10-12",                  initialLoad: "90.00", loadProgression: "2.50", technique: "Padrão",                  restTime: "75s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 11, orderIndex: 4, sets: 4, reps: "3x10-12 + 1x15",           initialLoad: "100.00",loadProgression: "2.50", technique: "Back off",                restTime: "75s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 12, orderIndex: 5, sets: 4, reps: "4x10-12",                  initialLoad: "50.00", loadProgression: "2.50", technique: "Padrão",                  restTime: "60s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 31, orderIndex: 6, sets: 4, reps: "4x12 cada braço",          initialLoad: "15.00", loadProgression: "1.00", technique: "Aumento de volume",       restTime: "60s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 32, orderIndex: 7, sets: 4, reps: "4x10+10",                  initialLoad: "40.00", loadProgression: "1.00", technique: "Combinação Rosca Martelo", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 34, orderIndex: 8, sets: 3, reps: "3x8-10",                   initialLoad: "35.00", loadProgression: "2.50", technique: "Novo exercício (força)",  restTime: "90s" },
    // Treino C - Membros Inferiores
    { cycleId: 1, workoutTypeId: 3, exerciseId: 15, orderIndex: 1, sets: 6, reps: "2x12 / 2x10 / 2x8",       initialLoad: "150.00",loadProgression: "5.00", technique: "Aquecimento + Progressão", restTime: "2 min" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 16, orderIndex: 2, sets: 5, reps: "4x10-12 + 1x15",           initialLoad: "300.00",loadProgression: "10.00",technique: "Cadência 2\"+2\" + Back off",restTime: "90s" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 17, orderIndex: 3, sets: 4, reps: "3x falha + 1x12-15",       initialLoad: "80.00", loadProgression: "2.50", technique: "Drop set",                restTime: "75s" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 18, orderIndex: 4, sets: 4, reps: "4x10-12",                  initialLoad: "70.00", loadProgression: "2.50", technique: "Padrão",                  restTime: "75s" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 19, orderIndex: 5, sets: 4, reps: "3x falha + 1x12-15",       initialLoad: "75.00", loadProgression: "2.50", technique: "Drop set",                restTime: "75s" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 20, orderIndex: 6, sets: 4, reps: "4x15",                     initialLoad: "90.00", loadProgression: "2.50", technique: "Pico de contração",       restTime: "60s" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 47, orderIndex: 7, sets: 4, reps: "4x15",                     initialLoad: "60.00", loadProgression: "2.50", technique: "Padrão",                  restTime: "60s" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 21, orderIndex: 8, sets: 3, reps: "3x10-12",                  initialLoad: "150.00",loadProgression: "5.00", technique: "Novo exercício",           restTime: "75s" },
    // Treino D - Ombro, Trapézio e Abdome
    { cycleId: 1, workoutTypeId: 4, exerciseId: 24, orderIndex: 1, sets: 5, reps: "2x12 / 4x10-12",           initialLoad: "70.00", loadProgression: "2.50", technique: "Aquecimento + Progressão", restTime: "90s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 25, orderIndex: 2, sets: 5, reps: "4x10-12 + 1x15",           initialLoad: "18.00", loadProgression: "1.00", technique: "Back off",                restTime: "75s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 26, orderIndex: 3, sets: 4, reps: "4x10 cada lado",            initialLoad: "10.00", loadProgression: "0.50", technique: "Padrão",                  restTime: "60s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 27, orderIndex: 4, sets: 4, reps: "4x10-12",                  initialLoad: "15.00", loadProgression: "1.00", technique: "Pegada aberta",            restTime: "60s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 45, orderIndex: 5, sets: 4, reps: "4x15",                     initialLoad: "30.00", loadProgression: "2.50", technique: "Padrão",                  restTime: "60s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 46, orderIndex: 6, sets: 3, reps: "3x12-15",                  initialLoad: "80.00", loadProgression: "2.50", technique: "Novo exercício",           restTime: "60s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 41, orderIndex: 7, sets: 4, reps: "4x15",                     initialLoad: "0.00",  loadProgression: "0.00", technique: "Sem descolar lombar",     restTime: "45s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 42, orderIndex: 8, sets: 3, reps: "3x12-15",                  initialLoad: "0.00",  loadProgression: "0.00", technique: "Novo exercício",           restTime: "45s" },
  ]);

  // 6. Cardio
  console.log("🏃 Inserindo recomendações de cardio...");
  await db.insert(cardioRecommendations).values([
    { cycleId: 1, frequency: "4x na semana", duration: "30 minutos", intensity: "Baixa (LISS)", timing: "Em jejum ou após treinos" },
    { cycleId: 2, frequency: "4x na semana", duration: "35 minutos", intensity: "Baixa (LISS)", timing: "Em jejum ou após treinos" },
    { cycleId: 3, frequency: "5x na semana", duration: "30 minutos", intensity: "Mista (LISS + 1 HIIT)", timing: "Em jejum ou após treinos" },
    { cycleId: 4, frequency: "6x na semana", duration: "30-40 minutos", intensity: "Mista (LISS + 2 HIIT)", timing: "Em jejum ou após treinos" },
  ]);

  console.log("✅ Seed concluído com sucesso!");
  await pool.end();
}

seed().catch(err => {
  console.error("❌ Seed falhou:", err);
  process.exit(1);
});
