import { drizzle } from "drizzle-orm/mysql2";
import { achievements } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const achievementsData = [
  // Conquistas de Treino
  {
    name: "Primeiro Passo",
    description: "Complete seu primeiro treino",
    icon: "Dumbbell",
    category: "treino",
    requirement: "1 treino completo",
    points: 10,
  },
  {
    name: "Maratonista",
    description: "Complete 10 treinos",
    icon: "Target",
    category: "treino",
    requirement: "10 treinos completos",
    points: 25,
  },
  {
    name: "Veterano",
    description: "Complete 50 treinos",
    icon: "Award",
    category: "treino",
    requirement: "50 treinos completos",
    points: 50,
  },
  {
    name: "Lenda",
    description: "Complete 100 treinos",
    icon: "Trophy",
    category: "treino",
    requirement: "100 treinos completos",
    points: 100,
  },
  
  // Conquistas de Frequência
  {
    name: "Semana Perfeita",
    description: "Complete todos os treinos da semana",
    icon: "Calendar",
    category: "frequencia",
    requirement: "4 treinos em 1 semana",
    points: 20,
  },
  {
    name: "Sequência de Fogo",
    description: "Treine 7 dias consecutivos",
    icon: "Flame",
    category: "frequencia",
    requirement: "7 dias consecutivos",
    points: 30,
  },
  {
    name: "Mês Completo",
    description: "Treine todos os dias úteis do mês",
    icon: "Calendar",
    category: "frequencia",
    requirement: "20+ treinos em 1 mês",
    points: 50,
  },
  
  // Conquistas de Força
  {
    name: "Força Crescente",
    description: "Aumente a carga em 10kg total",
    icon: "TrendingUp",
    category: "carga",
    requirement: "+10kg em qualquer exercício",
    points: 15,
  },
  {
    name: "Powerlifter",
    description: "Aumente a carga em 50kg total",
    icon: "Zap",
    category: "carga",
    requirement: "+50kg em qualquer exercício",
    points: 40,
  },
  {
    name: "Titã",
    description: "Aumente a carga em 100kg total",
    icon: "Trophy",
    category: "carga",
    requirement: "+100kg em qualquer exercício",
    points: 75,
  },
  
  // Conquistas Gerais
  {
    name: "Bem-vindo",
    description: "Complete seu perfil e anamnese",
    icon: "Star",
    category: "geral",
    requirement: "Preencher anamnese",
    points: 10,
  },
  {
    name: "Transformação",
    description: "Registre mudança de 5kg no peso corporal",
    icon: "TrendingUp",
    category: "geral",
    requirement: "±5kg de mudança",
    points: 25,
  },
  {
    name: "Ciclo Completo",
    description: "Complete um ciclo inteiro de 12 semanas",
    icon: "Award",
    category: "geral",
    requirement: "12 semanas de treino",
    points: 60,
  },
];

async function seedAchievements() {
  console.log("🏆 Populando conquistas...");
  
  try {
    for (const achievement of achievementsData) {
      await db.insert(achievements).values(achievement);
      console.log(`✅ Conquista adicionada: ${achievement.name}`);
    }
    
    console.log(`\n✨ ${achievementsData.length} conquistas adicionadas com sucesso!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao popular conquistas:", error);
    process.exit(1);
  }
}

seedAchievements();
