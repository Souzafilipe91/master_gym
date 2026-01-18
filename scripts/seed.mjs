import { drizzle } from "drizzle-orm/mysql2";
import { 
  cycles, workoutTypes, muscleGroups, exercises, 
  workoutExercises, cardioRecommendations 
} from "../drizzle/schema.js";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Starting database seed...");

  // 1. Inserir Ciclos
  console.log("📅 Inserting cycles...");
  const cyclesData = [
    {
      cycleNumber: 1,
      name: "CICLO 1: HIPERTROFIA COM FORÇA",
      startWeek: 1,
      endWeek: 12,
      objective: "Ganho de massa muscular com aumento de força",
      focus: "Volume e Progressão Linear",
      description: "Semanas 1-12 (Jan-Mar 2026)"
    },
    {
      cycleNumber: 2,
      name: "CICLO 2: HIPERTROFIA MÁXIMA",
      startWeek: 13,
      endWeek: 24,
      objective: "Máximo ganho de massa muscular",
      focus: "Volume Alto e Técnicas Avançadas",
      description: "Semanas 13-24 (Abr-Jun 2026) - Aumentar volume em 15-20%, manter cargas, adicionar mais séries de trabalho"
    },
    {
      cycleNumber: 3,
      name: "CICLO 3: FORÇA E DEFINIÇÃO",
      startWeek: 25,
      endWeek: 36,
      objective: "Ganho de força com manutenção de definição",
      focus: "Força e Densidade Muscular",
      description: "Semanas 25-36 (Jul-Set 2026) - Aumentar cargas, reduzir repetições, aumentar cardio"
    },
    {
      cycleNumber: 4,
      name: "CICLO 4: DEFINIÇÃO COM FORÇA",
      startWeek: 37,
      endWeek: 52,
      objective: "Ganho de definição mantendo força",
      focus: "Definição e Manutenção",
      description: "Semanas 37-52 (Out-Dez 2026) - Aumentar cardio, manter cargas, aumentar repetições, deficit calórico leve"
    }
  ];

  for (const cycle of cyclesData) {
    await db.insert(cycles).values(cycle);
  }

  // 2. Inserir Tipos de Treino
  console.log("💪 Inserting workout types...");
  const workoutTypesData = [
    { code: "A", name: "Peito e Tríceps", duration: 70, description: "Treino focado em peitoral e tríceps" },
    { code: "B", name: "Costas e Bíceps", duration: 70, description: "Treino focado em costas e bíceps" },
    { code: "C", name: "Membros Inferiores", duration: 75, description: "Treino focado em pernas e panturrilhas" },
    { code: "D", name: "Ombro, Trapézio e Abdome", duration: 70, description: "Treino focado em ombros, trapézio e abdômen" }
  ];

  for (const workoutType of workoutTypesData) {
    await db.insert(workoutTypes).values(workoutType);
  }

  // 3. Inserir Grupos Musculares
  console.log("🎯 Inserting muscle groups...");
  const muscleGroupsData = [
    { name: "Peito" },
    { name: "Costas" },
    { name: "Pernas" },
    { name: "Ombro" },
    { name: "Bíceps" },
    { name: "Tríceps" },
    { name: "Abdômen" },
    { name: "Trapézio" },
    { name: "Panturrilha" }
  ];

  for (const muscleGroup of muscleGroupsData) {
    await db.insert(muscleGroups).values(muscleGroup);
  }

  // 4. Inserir Exercícios
  console.log("🏋️ Inserting exercises...");
  const exercisesData = [
    // Peito (muscleGroupId: 1)
    { name: "Supino Reto com Halter", muscleGroupId: 1 },
    { name: "Supino Inclinado com Halter", muscleGroupId: 1 },
    { name: "Voador", muscleGroupId: 1 },
    { name: "Chest Press", muscleGroupId: 1 },
    { name: "Crucifixo com Halteres", muscleGroupId: 1 },
    { name: "Cross Over Polia Alta", muscleGroupId: 1 },
    { name: "Crucifixo Inclinado", muscleGroupId: 1 },
    
    // Costas (muscleGroupId: 2)
    { name: "Puxador Costas Frente Pegada Aberta", muscleGroupId: 2 },
    { name: "Puxador Costas Frente Triângulo", muscleGroupId: 2 },
    { name: "Remada Articulada Pronada", muscleGroupId: 2 },
    { name: "Remada Baixa Triângulo", muscleGroupId: 2 },
    { name: "Crucifixo Inverso na Máquina", muscleGroupId: 2 },
    { name: "Barra Fixa", muscleGroupId: 2 },
    { name: "Remada Curvada", muscleGroupId: 2 },
    
    // Pernas (muscleGroupId: 3)
    { name: "Agachamento Hack", muscleGroupId: 3 },
    { name: "Leg Press 45°", muscleGroupId: 3 },
    { name: "Cadeira Extensora", muscleGroupId: 3 },
    { name: "Mesa Flexora", muscleGroupId: 3 },
    { name: "Cadeira Flexora", muscleGroupId: 3 },
    { name: "Cadeira Abdutora", muscleGroupId: 3 },
    { name: "Leg Press Unilateral", muscleGroupId: 3 },
    { name: "Agachamento Livre", muscleGroupId: 3 },
    
    // Ombro (muscleGroupId: 4)
    { name: "Desenvolvimento Máquina Simultâneo", muscleGroupId: 4 },
    { name: "Desenvolvimento Arnold", muscleGroupId: 4 },
    { name: "Elevação Lateral", muscleGroupId: 4 },
    { name: "Elevação Lateral Unilateral no Cross", muscleGroupId: 4 },
    { name: "Desenvolvimento com Halteres", muscleGroupId: 4 },
    { name: "Elevação Frontal", muscleGroupId: 4 },
    
    // Bíceps (muscleGroupId: 5)
    { name: "Rosca Alternada com Rotação", muscleGroupId: 5 },
    { name: "Rosca Direta Cross", muscleGroupId: 5 },
    { name: "Rosca Martelo", muscleGroupId: 5 },
    { name: "Rosca Direta Barra Reta", muscleGroupId: 5 },
    { name: "Rosca Concentrada", muscleGroupId: 5 },
    
    // Tríceps (muscleGroupId: 6)
    { name: "Tríceps Pulley Barra Reta", muscleGroupId: 6 },
    { name: "Tríceps Francês Corda no Cross", muscleGroupId: 6 },
    { name: "Tríceps Testa com Halter", muscleGroupId: 6 },
    { name: "Tríceps Coice", muscleGroupId: 6 },
    { name: "Mergulho", muscleGroupId: 6 },
    
    // Abdômen (muscleGroupId: 7)
    { name: "Abdômen no Solo", muscleGroupId: 7 },
    { name: "Abdominal Declinado", muscleGroupId: 7 },
    { name: "Abdominal Infra", muscleGroupId: 7 },
    { name: "Prancha", muscleGroupId: 7 },
    
    // Trapézio (muscleGroupId: 8)
    { name: "Encolhimento com Halter", muscleGroupId: 8 },
    { name: "Encolhimento na Máquina", muscleGroupId: 8 },
    
    // Panturrilha (muscleGroupId: 9)
    { name: "Panturrilha Sentado", muscleGroupId: 9 },
    { name: "Panturrilha em Pé", muscleGroupId: 9 }
  ];

  for (const exercise of exercisesData) {
    await db.insert(exercises).values(exercise);
  }

  // 5. Inserir Exercícios do Treino (Ciclo 1)
  console.log("📋 Inserting workout exercises for Cycle 1...");
  
  // Treino A - Peito e Tríceps (workoutTypeId: 1, cycleId: 1)
  const treinoAExercises = [
    { cycleId: 1, workoutTypeId: 1, exerciseId: 1, orderIndex: 1, sets: 6, reps: "2x12 / 2x10 / 2x8", initialLoad: "45.00", loadProgression: "2.50", technique: "Aquecimento + Progressão", restTime: "90s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 2, orderIndex: 2, sets: 5, reps: "1x12 / 2x10 / 2x8", initialLoad: "40.00", loadProgression: "2.50", technique: "Progressão de carga", restTime: "90s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 3, orderIndex: 3, sets: 4, reps: "3x10-12 + 1x4+4+4", initialLoad: "20.00", loadProgression: "2.50", technique: "Cluster set", restTime: "75s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 4, orderIndex: 4, sets: 4, reps: "3x10-12 + 1x4+4+4", initialLoad: "100.00", loadProgression: "5.00", technique: "Cluster set", restTime: "75s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 5, orderIndex: 5, sets: 3, reps: "3x12-15", initialLoad: "15.00", loadProgression: "1.00", technique: "Novo exercício", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 36, orderIndex: 6, sets: 5, reps: "4x10+falha + 1x15", initialLoad: "50.00", loadProgression: "2.50", technique: "Drop set + Back off", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 37, orderIndex: 7, sets: 4, reps: "4x10-12", initialLoad: "35.00", loadProgression: "2.50", technique: "Padrão", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 1, exerciseId: 38, orderIndex: 8, sets: 4, reps: "4x10-12", initialLoad: "18.00", loadProgression: "1.00", technique: "Padrão", restTime: "60s" }
  ];

  // Treino B - Costas e Bíceps (workoutTypeId: 2, cycleId: 1)
  const treinoBExercises = [
    { cycleId: 1, workoutTypeId: 2, exerciseId: 8, orderIndex: 1, sets: 6, reps: "2x12 / 2x10 / 2x8", initialLoad: "80.00", loadProgression: "2.50", technique: "Aquecimento + Progressão", restTime: "90s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 9, orderIndex: 2, sets: 5, reps: "4x10-12 + 1x4+4+4", initialLoad: "85.00", loadProgression: "2.50", technique: "Cluster set", restTime: "75s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 10, orderIndex: 3, sets: 4, reps: "4x10-12", initialLoad: "90.00", loadProgression: "2.50", technique: "Padrão", restTime: "75s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 11, orderIndex: 4, sets: 4, reps: "3x10-12 + 1x15", initialLoad: "100.00", loadProgression: "2.50", technique: "Back off", restTime: "75s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 12, orderIndex: 5, sets: 4, reps: "4x10-12", initialLoad: "50.00", loadProgression: "2.50", technique: "Padrão", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 31, orderIndex: 6, sets: 4, reps: "4x12 cada braço", initialLoad: "15.00", loadProgression: "1.00", technique: "Aumento de volume", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 32, orderIndex: 7, sets: 4, reps: "4x10+10", initialLoad: "40.00", loadProgression: "1.00", technique: "Combinação com Rosca Martelo", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 2, exerciseId: 34, orderIndex: 8, sets: 3, reps: "3x8-10", initialLoad: "35.00", loadProgression: "2.50", technique: "Novo exercício (força)", restTime: "90s" }
  ];

  // Treino C - Membros Inferiores (workoutTypeId: 3, cycleId: 1)
  const treinoCExercises = [
    { cycleId: 1, workoutTypeId: 3, exerciseId: 15, orderIndex: 1, sets: 6, reps: "2x12 / 2x10 / 2x8", initialLoad: "150.00", loadProgression: "5.00", technique: "Aquecimento + Progressão", restTime: "2 min" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 16, orderIndex: 2, sets: 5, reps: "4x10-12 + 1x15", initialLoad: "300.00", loadProgression: "10.00", technique: "Cadência 2\"+2\" + Back off", restTime: "90s" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 17, orderIndex: 3, sets: 4, reps: "3x falha + 1x12-15", initialLoad: "80.00", loadProgression: "2.50", technique: "Drop set", restTime: "75s" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 18, orderIndex: 4, sets: 4, reps: "4x10-12", initialLoad: "70.00", loadProgression: "2.50", technique: "Padrão", restTime: "75s" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 19, orderIndex: 5, sets: 4, reps: "3x falha + 1x12-15", initialLoad: "75.00", loadProgression: "2.50", technique: "Drop set", restTime: "75s" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 20, orderIndex: 6, sets: 4, reps: "4x15", initialLoad: "90.00", loadProgression: "2.50", technique: "Pico de contração", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 47, orderIndex: 7, sets: 4, reps: "4x15", initialLoad: "60.00", loadProgression: "2.50", technique: "Padrão", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 3, exerciseId: 21, orderIndex: 8, sets: 3, reps: "3x10-12", initialLoad: "150.00", loadProgression: "5.00", technique: "Novo exercício", restTime: "75s" }
  ];

  // Treino D - Ombro, Trapézio e Abdome (workoutTypeId: 4, cycleId: 1)
  const treinoDExercises = [
    { cycleId: 1, workoutTypeId: 4, exerciseId: 24, orderIndex: 1, sets: 5, reps: "2x12 / 4x10-12", initialLoad: "70.00", loadProgression: "2.50", technique: "Aquecimento + Progressão", restTime: "90s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 25, orderIndex: 2, sets: 5, reps: "4x10-12 + 1x15", initialLoad: "18.00", loadProgression: "1.00", technique: "Back off", restTime: "75s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 26, orderIndex: 3, sets: 4, reps: "4x10 cada lado", initialLoad: "10.00", loadProgression: "0.50", technique: "Padrão", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 27, orderIndex: 4, sets: 4, reps: "4x10-12", initialLoad: "15.00", loadProgression: "1.00", technique: "Pegada aberta", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 45, orderIndex: 5, sets: 4, reps: "4x15", initialLoad: "30.00", loadProgression: "2.50", technique: "Padrão", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 46, orderIndex: 6, sets: 3, reps: "3x12-15", initialLoad: "80.00", loadProgression: "2.50", technique: "Novo exercício", restTime: "60s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 41, orderIndex: 7, sets: 4, reps: "4x15", initialLoad: "0.00", loadProgression: "0.00", technique: "Sem descolar lombar", restTime: "45s" },
    { cycleId: 1, workoutTypeId: 4, exerciseId: 42, orderIndex: 8, sets: 3, reps: "3x12-15", initialLoad: "0.00", loadProgression: "0.00", technique: "Novo exercício", restTime: "45s" }
  ];

  const allWorkoutExercises = [...treinoAExercises, ...treinoBExercises, ...treinoCExercises, ...treinoDExercises];
  for (const workoutExercise of allWorkoutExercises) {
    await db.insert(workoutExercises).values(workoutExercise);
  }

  // 6. Inserir Recomendações de Cardio
  console.log("🏃 Inserting cardio recommendations...");
  const cardioData = [
    { cycleId: 1, frequency: "4x na semana", duration: "30 minutos", intensity: "Baixa (LISS)", timing: "Em jejum ou após treinos" },
    { cycleId: 2, frequency: "4x na semana", duration: "35 minutos", intensity: "Baixa (LISS)", timing: "Em jejum ou após treinos" },
    { cycleId: 3, frequency: "5x na semana", duration: "30 minutos", intensity: "Mista (LISS + 1 HIIT)", timing: "Em jejum ou após treinos" },
    { cycleId: 4, frequency: "6x na semana", duration: "30-40 minutos", intensity: "Mista (LISS + 2 HIIT)", timing: "Em jejum ou após treinos" }
  ];

  for (const cardio of cardioData) {
    await db.insert(cardioRecommendations).values(cardio);
  }

  console.log("✅ Database seeded successfully!");
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
