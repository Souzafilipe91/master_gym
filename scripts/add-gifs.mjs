import { drizzle } from "drizzle-orm/mysql2";
import { exercises } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

// Mapeamento de exercícios para GIFs (usando URLs públicas de exemplo)
// Em produção, você pode usar uma API ou hospedar seus próprios GIFs
const exerciseGifs = {
  // Peito
  "Supino Reto com Barra": "https://i.pinimg.com/originals/8c/35/8d/8c358d3f4a7f8b5e5e5e5e5e5e5e5e5e.gif",
  "Supino Inclinado com Halteres": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Incline-Bench-Press.gif",
  "Crucifixo Inclinado": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Dumbbell-Fly.gif",
  "Crossover": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Cross-Over.gif",
  "Supino Declinado": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Decline-Barbell-Bench-Press.gif",
  "Tríceps Testa": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Lying-Triceps-Extension.gif",
  "Tríceps Corda": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Rope-Pushdown.gif",
  "Tríceps Francês": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Overhead-Triceps-Extension.gif",
  
  // Costas
  "Barra Fixa": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-up.gif",
  "Remada Curvada": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bent-Over-Row.gif",
  "Puxada Frontal": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif",
  "Remada Unilateral": "https://fitnessprogramer.com/wp-content/uploads/2021/02/One-Arm-Dumbbell-Row.gif",
  "Pullover": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Pullover.gif",
  "Rosca Direta": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Curl.gif",
  "Rosca Alternada": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Curl.gif",
  "Rosca Martelo": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Hammer-Curl.gif",
  
  // Pernas
  "Agachamento Livre": "https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif",
  "Leg Press 45°": "https://fitnessprogramer.com/wp-content/uploads/2021/02/LEG-PRESS.gif",
  "Cadeira Extensora": "https://fitnessprogramer.com/wp-content/uploads/2021/02/LEG-EXTENSION.gif",
  "Mesa Flexora": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Curl.gif",
  "Stiff": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Stiff-Leg-Deadlift.gif",
  "Afundo": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lunge.gif",
  "Panturrilha em Pé": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Standing-Calf-Raise.gif",
  
  // Ombros
  "Desenvolvimento com Barra": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Standing-Military-Press.gif",
  "Desenvolvimento com Halteres": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif",
  "Elevação Lateral": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif",
  "Elevação Frontal": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Front-Raise.gif",
  "Crucifixo Inverso": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Rear-Delt-Fly.gif",
  "Encolhimento com Barra": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Shrug.gif",
  "Remada Alta": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Upright-Row.gif",
  "Abdominal Supra": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Crunch.gif",
  "Abdominal Infra": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Raise.gif",
  "Prancha": "https://fitnessprogramer.com/wp-content/uploads/2021/02/Plank.gif",
};

async function updateExerciseGifs() {
  console.log("Atualizando GIFs dos exercícios...");
  
  try {
    // Buscar todos os exercícios
    const allExercises = await db.select().from(exercises);
    
    let updated = 0;
    for (const exercise of allExercises) {
      const gifUrl = exerciseGifs[exercise.name];
      if (gifUrl) {
        await db.update(exercises)
          .set({ gifUrl })
          .where(eq(exercises.id, exercise.id));
        console.log(`✓ Atualizado: ${exercise.name}`);
        updated++;
      } else {
        console.log(`⚠ GIF não encontrado para: ${exercise.name}`);
      }
    }
    
    console.log(`\n✅ ${updated} exercícios atualizados com GIFs!`);
  } catch (error) {
    console.error("Erro ao atualizar GIFs:", error);
  }
}

updateExerciseGifs();
