import { drizzle } from "drizzle-orm/mysql2";
import { exercises } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

// Mapeamento completo de exercícios para GIFs usando URLs públicas
const exerciseGifs = {
  // ===== PEITO =====
  "Supino Reto com Halter": "https://newlife.com.cy/wp-content/uploads/2019/11/00071301-Dumbbell-Bench-Press_Chest_small.gif",
  "Supino Reto com Barra": "https://newlife.com.cy/wp-content/uploads/2019/11/00081301-Barbell-Bench-Press_Chest_small.gif",
  "Supino Inclinado com Halter": "https://newlife.com.cy/wp-content/uploads/2019/11/00091301-Dumbbell-Incline-Bench-Press_Chest_small.gif",
  "Supino Inclinado com Halteres": "https://newlife.com.cy/wp-content/uploads/2019/11/00091301-Dumbbell-Incline-Bench-Press_Chest_small.gif",
  "Voador": "https://newlife.com.cy/wp-content/uploads/2019/11/01021301-Lever-Pec-Deck-Fly_Chest_small.gif",
  "Chest Press": "https://newlife.com.cy/wp-content/uploads/2019/11/01011301-Lever-Chest-Press_Chest_small.gif",
  "Crucifixo com Halteres": "https://newlife.com.cy/wp-content/uploads/2019/11/00101301-Dumbbell-Fly_Chest_small.gif",
  "Cross Over Polia Alta": "https://newlife.com.cy/wp-content/uploads/2019/11/00261301-Cable-Standing-Up-Straight-Crossovers_Chest_small.gif",
  "Crucifixo Inclinado": "https://newlife.com.cy/wp-content/uploads/2019/11/00111301-Dumbbell-Incline-Fly_Chest_small.gif",
  "Crossover": "https://newlife.com.cy/wp-content/uploads/2019/11/00261301-Cable-Standing-Up-Straight-Crossovers_Chest_small.gif",
  "Supino Declinado": "https://newlife.com.cy/wp-content/uploads/2019/11/00101301-Barbell-Decline-Bench-Press_Chest_small.gif",
  
  // ===== COSTAS =====
  "Puxador Costas Frente Pegada Aberta": "https://newlife.com.cy/wp-content/uploads/2019/11/00421301-Cable-Wide-Grip-Lat-Pulldown_Back_small.gif",
  "Puxador Costas Frente Triângulo": "https://newlife.com.cy/wp-content/uploads/2019/11/00431301-Cable-Close-Grip-Lat-Pulldown_Back_small.gif",
  "Remada Articulada Pronada": "https://newlife.com.cy/wp-content/uploads/2019/11/01021301-Lever-T-bar-Row_Back_small.gif",
  "Remada Baixa Triângulo": "https://newlife.com.cy/wp-content/uploads/2019/11/00441301-Cable-Seated-Row_Back_small.gif",
  "Crucifixo Inverso na Máquina": "https://newlife.com.cy/wp-content/uploads/2019/11/01041301-Lever-Reverse-Fly_Shoulders_small.gif",
  "Barra Fixa": "https://newlife.com.cy/wp-content/uploads/2019/11/00401301-Pull-up_Back_small.gif",
  "Remada Curvada": "https://newlife.com.cy/wp-content/uploads/2019/11/00511301-Barbell-Bent-Over-Row_Back_small.gif",
  "Puxada Frontal": "https://newlife.com.cy/wp-content/uploads/2019/11/00421301-Cable-Wide-Grip-Lat-Pulldown_Back_small.gif",
  "Remada Unilateral": "https://newlife.com.cy/wp-content/uploads/2019/11/00461301-Dumbbell-One-Arm-Row_Back_small.gif",
  "Pullover": "https://newlife.com.cy/wp-content/uploads/2019/11/00171301-Dumbbell-Pullover_Chest_small.gif",
  
  // ===== PERNAS =====
  "Agachamento Hack": "https://newlife.com.cy/wp-content/uploads/2019/11/01311301-Sled-45-Degree-Hack-Squat_Thighs_small.gif",
  "Leg Press 45°": "https://newlife.com.cy/wp-content/uploads/2019/11/01251301-Sled-45-Degree-Leg-Press_Thighs_small.gif",
  "Cadeira Extensora": "https://newlife.com.cy/wp-content/uploads/2019/11/01361301-Lever-Leg-Extension_Thighs_small.gif",
  "Mesa Flexora": "https://newlife.com.cy/wp-content/uploads/2019/11/01421301-Lever-Lying-Leg-Curl_Thighs_small.gif",
  "Cadeira Flexora": "https://newlife.com.cy/wp-content/uploads/2019/11/01431301-Lever-Seated-Leg-Curl_Thighs_small.gif",
  "Cadeira Abdutora": "https://newlife.com.cy/wp-content/uploads/2019/11/01491301-Lever-Hip-Abduction_Hips_small.gif",
  "Leg Press Unilateral": "https://newlife.com.cy/wp-content/uploads/2019/11/01251301-Sled-45-Degree-Leg-Press_Thighs_small.gif",
  "Agachamento Livre": "https://newlife.com.cy/wp-content/uploads/2019/11/00881301-Barbell-Full-Squat_Thighs_small.gif",
  "Stiff": "https://newlife.com.cy/wp-content/uploads/2019/11/00941301-Barbell-Stiff-Leg-Deadlift_Hips_small.gif",
  "Afundo": "https://newlife.com.cy/wp-content/uploads/2019/11/01201301-Dumbbell-Lunge_Thighs_small.gif",
  "Panturrilha em Pé": "https://newlife.com.cy/wp-content/uploads/2019/11/01471301-Lever-Standing-Calf-Raise_Calves_small.gif",
  "Panturrilha Sentado": "https://newlife.com.cy/wp-content/uploads/2019/11/01481301-Lever-Seated-Calf-Raise_Calves_small.gif",
  
  // ===== OMBROS =====
  "Desenvolvimento Máquina Simultâneo": "https://newlife.com.cy/wp-content/uploads/2019/11/01021301-Lever-Shoulder-Press_Shoulders_small.gif",
  "Desenvolvimento Arnold": "https://newlife.com.cy/wp-content/uploads/2019/11/00631301-Dumbbell-Arnold-Press_Shoulders_small.gif",
  "Elevação Lateral": "https://newlife.com.cy/wp-content/uploads/2019/11/00611301-Dumbbell-Lateral-Raise_Shoulders_small.gif",
  "Elevação Lateral Unilateral no Cross": "https://newlife.com.cy/wp-content/uploads/2019/11/00661301-Cable-Lateral-Raise_Shoulders_small.gif",
  "Desenvolvimento com Barra": "https://newlife.com.cy/wp-content/uploads/2019/11/00711301-Barbell-Standing-Military-Press_Shoulders_small.gif",
  "Desenvolvimento com Halteres": "https://newlife.com.cy/wp-content/uploads/2019/11/00621301-Dumbbell-Shoulder-Press_Shoulders_small.gif",
  "Elevação Frontal": "https://newlife.com.cy/wp-content/uploads/2019/11/00591301-Dumbbell-Front-Raise_Shoulders_small.gif",
  "Crucifixo Inverso": "https://newlife.com.cy/wp-content/uploads/2019/11/00641301-Dumbbell-Rear-Delt-Fly_Shoulders_small.gif",
  "Encolhimento com Barra": "https://newlife.com.cy/wp-content/uploads/2019/11/00761301-Barbell-Shrug_Back_small.gif",
  "Encolhimento com Halter": "https://newlife.com.cy/wp-content/uploads/2019/11/00691301-Dumbbell-Shrug_Back_small.gif",
  "Encolhimento na Máquina": "https://newlife.com.cy/wp-content/uploads/2019/11/01041301-Lever-Shrug_Back_small.gif",
  "Remada Alta": "https://newlife.com.cy/wp-content/uploads/2019/11/00731301-Barbell-Upright-Row_Shoulders_small.gif",
  
  // ===== BÍCEPS =====
  "Rosca Alternada com Rotação": "https://newlife.com.cy/wp-content/uploads/2019/11/00161301-Dumbbell-Alternate-Biceps-Curl_Upper-Arms_small.gif",
  "Rosca Direta Cross": "https://newlife.com.cy/wp-content/uploads/2019/11/00211301-Cable-Curl_Upper-Arms_small.gif",
  "Rosca Martelo": "https://newlife.com.cy/wp-content/uploads/2019/11/00181301-Dumbbell-Hammer-Curl_Upper-Arms_small.gif",
  "Rosca Direta Barra Reta": "https://newlife.com.cy/wp-content/uploads/2019/11/00231301-Barbell-Curl_Upper-Arms_small.gif",
  "Rosca Concentrada": "https://newlife.com.cy/wp-content/uploads/2019/11/00191301-Dumbbell-Concentration-Curl_Upper-Arms_small.gif",
  "Rosca Direta": "https://newlife.com.cy/wp-content/uploads/2019/11/00231301-Barbell-Curl_Upper-Arms_small.gif",
  "Rosca Alternada": "https://newlife.com.cy/wp-content/uploads/2019/11/00161301-Dumbbell-Alternate-Biceps-Curl_Upper-Arms_small.gif",
  
  // ===== TRÍCEPS =====
  "Tríceps Pulley Barra Reta": "https://newlife.com.cy/wp-content/uploads/2019/11/00331301-Cable-Pushdown_Upper-Arms_small.gif",
  "Tríceps Francês Corda no Cross": "https://newlife.com.cy/wp-content/uploads/2019/11/00351301-Cable-Overhead-Triceps-Extension_Upper-Arms_small.gif",
  "Tríceps Testa com Halter": "https://newlife.com.cy/wp-content/uploads/2019/11/00361301-Dumbbell-Lying-Triceps-Extension_Upper-Arms_small.gif",
  "Tríceps Coice": "https://newlife.com.cy/wp-content/uploads/2019/11/00381301-Dumbbell-Kickback_Upper-Arms_small.gif",
  "Mergulho": "https://newlife.com.cy/wp-content/uploads/2019/11/00321301-Triceps-Dip_Upper-Arms_small.gif",
  "Tríceps Testa": "https://newlife.com.cy/wp-content/uploads/2019/11/00361301-Dumbbell-Lying-Triceps-Extension_Upper-Arms_small.gif",
  "Tríceps Corda": "https://newlife.com.cy/wp-content/uploads/2019/11/00341301-Cable-Rope-Pushdown_Upper-Arms_small.gif",
  "Tríceps Francês": "https://newlife.com.cy/wp-content/uploads/2019/11/00351301-Cable-Overhead-Triceps-Extension_Upper-Arms_small.gif",
  
  // ===== ABDÔMEN =====
  "Abdômen no Solo": "https://newlife.com.cy/wp-content/uploads/2019/11/00011301-Crunch_Waist_small.gif",
  "Abdominal Declinado": "https://newlife.com.cy/wp-content/uploads/2019/11/00021301-Decline-Crunch_Waist_small.gif",
  "Abdominal Infra": "https://newlife.com.cy/wp-content/uploads/2019/11/00031301-Hanging-Leg-Raise_Waist_small.gif",
  "Abdominal Supra": "https://newlife.com.cy/wp-content/uploads/2019/11/00011301-Crunch_Waist_small.gif",
  "Prancha": "https://newlife.com.cy/wp-content/uploads/2019/11/00041301-Front-Plank_Waist_small.gif",
};

async function updateAllExerciseGifs() {
  console.log("Atualizando GIFs de TODOS os exercícios...\n");
  
  try {
    // Buscar todos os exercícios
    const allExercises = await db.select().from(exercises);
    console.log(`Total de exercícios no banco: ${allExercises.length}\n`);
    
    let updated = 0;
    let notFound = 0;
    
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
        notFound++;
      }
    }
    
    console.log(`\n========================================`);
    console.log(`✅ ${updated} exercícios atualizados com GIFs!`);
    console.log(`⚠  ${notFound} exercícios ainda sem GIF`);
    console.log(`========================================\n`);
  } catch (error) {
    console.error("Erro ao atualizar GIFs:", error);
  }
}

updateAllExerciseGifs();
