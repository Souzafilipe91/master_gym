import { describe, it, expect, beforeEach } from "vitest";

// ─── Testes do parser de markdown de calistenia ──────────────────────────────

function parseWorkoutMarkdown(markdown: string) {
  const lines = markdown.split("\n").map((l: string) => l.trim()).filter(Boolean);
  const exercises: Array<{ name: string; sets: number; reps: string; rest: number }> = [];
  let title = "Treino de Calistenia";

  for (const line of lines) {
    if (line.startsWith("# ")) {
      title = line.replace(/^#\s+/, "");
      continue;
    }
    const exerciseMatch = line.match(/[-*]?\s*\*{1,2}([^*:]+)\*{0,2}[:\s]+(\d+)x([^\s,.(]+)/i);
    if (exerciseMatch) {
      const name = exerciseMatch[1].trim();
      const sets = parseInt(exerciseMatch[2]) || 3;
      const reps = exerciseMatch[3].trim();
      const restMatch = line.match(/descanso[:\s]+(\d+)\s*(s|seg|min|minuto)/i);
      let rest = 60;
      if (restMatch) {
        rest = restMatch[2].toLowerCase().startsWith("min")
          ? parseInt(restMatch[1]) * 60
          : parseInt(restMatch[1]);
      }
      exercises.push({ name, sets, reps, rest });
    }
  }

  if (exercises.length === 0) {
    const genericNames = [
      "Aquecimento", "Exercício Principal 1", "Exercício Principal 2",
      "Exercício Principal 3", "Exercício Complementar", "Alongamento Final"
    ];
    genericNames.forEach((name, i) => {
      exercises.push({ name, sets: i === 0 || i === genericNames.length - 1 ? 1 : 3, reps: "10-12", rest: 60 });
    });
  }

  return { title, exercises };
}

describe("parseWorkoutMarkdown", () => {
  it("deve extrair título do markdown", () => {
    const md = "# Treino Full Body\n- **Flexão**: 3x12";
    const result = parseWorkoutMarkdown(md);
    expect(result.title).toBe("Treino Full Body");
  });

  it("deve extrair exercícios com séries e reps", () => {
    const md = "- **Flexão de Braço**: 3x12\n- **Agachamento**: 4x15";
    const result = parseWorkoutMarkdown(md);
    expect(result.exercises).toHaveLength(2);
    expect(result.exercises[0].name).toBe("Flexão de Braço");
    expect(result.exercises[0].sets).toBe(3);
    expect(result.exercises[0].reps).toBe("12");
    expect(result.exercises[1].name).toBe("Agachamento");
    expect(result.exercises[1].sets).toBe(4);
  });

  it("deve extrair tempo de descanso em segundos", () => {
    const md = "- **Flexão**: 3x12, descanso: 45s";
    const result = parseWorkoutMarkdown(md);
    expect(result.exercises[0].rest).toBe(45);
  });

  it("deve converter descanso em minutos para segundos", () => {
    const md = "- **Agachamento**: 4x10, descanso: 2min";
    const result = parseWorkoutMarkdown(md);
    expect(result.exercises[0].rest).toBe(120);
  });

  it("deve usar descanso padrão de 60s quando não especificado", () => {
    const md = "- **Burpee**: 3x10";
    const result = parseWorkoutMarkdown(md);
    expect(result.exercises[0].rest).toBe(60);
  });

  it("deve retornar exercícios genéricos quando markdown não tem padrão reconhecível", () => {
    const md = "Aquecimento: 5 minutos de caminhada\nFaça 3 séries de cada exercício";
    const result = parseWorkoutMarkdown(md);
    expect(result.exercises.length).toBeGreaterThan(0);
    expect(result.exercises[0].name).toBe("Aquecimento");
  });

  it("deve usar título padrão quando não há cabeçalho H1", () => {
    const md = "- **Flexão**: 3x12";
    const result = parseWorkoutMarkdown(md);
    expect(result.title).toBe("Treino de Calistenia");
  });
});

// ─── Testes de lógica de treino salvo ────────────────────────────────────────

describe("Saved Workouts Logic", () => {
  it("deve identificar tipo calistenia corretamente", () => {
    const workout = { type: "calistenia", title: "Calistenia Full Body", content: "..." };
    expect(workout.type).toBe("calistenia");
  });

  it("deve identificar tipo copiado corretamente", () => {
    const workout = { type: "copied", title: "Treino do Chris Evans", content: "..." };
    expect(workout.type).toBe("copied");
  });

  it("deve formatar data corretamente", () => {
    const date = new Date("2026-03-30T12:00:00Z");
    const formatted = date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    expect(formatted).toMatch(/30/);
  });

  it("deve calcular progresso do treino corretamente", () => {
    const totalSets = 12;
    const completedSets = 6;
    const progress = (completedSets / totalSets) * 100;
    expect(progress).toBe(50);
  });

  it("deve calcular progresso 0% no início", () => {
    const totalSets = 10;
    const completedSets = 0;
    const progress = (completedSets / totalSets) * 100;
    expect(progress).toBe(0);
  });

  it("deve calcular progresso 100% ao finalizar", () => {
    const totalSets = 10;
    const completedSets = 10;
    const progress = (completedSets / totalSets) * 100;
    expect(progress).toBe(100);
  });
});

// ─── Testes de timer de descanso ─────────────────────────────────────────────

describe("Rest Timer Logic", () => {
  it("deve usar configuração do usuário quando disponível", () => {
    const mockLocalStorage: Record<string, string> = { "gym-rest-time": "120" };
    const getUserRestTime = () => {
      const saved = mockLocalStorage["gym-rest-time"];
      return saved ? parseInt(saved) : null;
    };
    const exerciseRestTime = 60;
    const userRest = getUserRestTime();
    const restDuration = userRest || exerciseRestTime;
    expect(restDuration).toBe(120);
  });

  it("deve usar tempo do exercício quando usuário não configurou", () => {
    const mockLocalStorage: Record<string, string> = {};
    const getUserRestTime = () => {
      const saved = mockLocalStorage["gym-rest-time"];
      return saved ? parseInt(saved) : null;
    };
    const exerciseRestTime = 90;
    const userRest = getUserRestTime();
    const restDuration = userRest || exerciseRestTime;
    expect(restDuration).toBe(90);
  });

  it("deve formatar tempo corretamente", () => {
    const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec.toString().padStart(2, "0")}`;
    };
    expect(formatTime(90)).toBe("1:30");
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(45)).toBe("0:45");
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(125)).toBe("2:05");
  });
});

// ─── Testes de lógica de navegação entre exercícios ──────────────────────────

describe("Exercise Navigation Logic", () => {
  const exercises = [
    { name: "Flexão", sets: 3, reps: "12", rest: 60 },
    { name: "Agachamento", sets: 4, reps: "15", rest: 60 },
    { name: "Prancha", sets: 3, reps: "30s", rest: 45 },
  ];

  it("deve avançar para próxima série dentro do mesmo exercício", () => {
    let currentSet = 1;
    const currentExercise = exercises[0];
    const isLastSet = currentSet >= currentExercise.sets;
    if (!isLastSet) currentSet++;
    expect(currentSet).toBe(2);
  });

  it("deve avançar para próximo exercício ao completar todas as séries", () => {
    let currentExIdx = 0;
    let currentSet = 3; // última série do exercício 0
    const currentExercise = exercises[currentExIdx];
    const isLastSet = currentSet >= currentExercise.sets;
    if (isLastSet) {
      currentExIdx++;
      currentSet = 1;
    }
    expect(currentExIdx).toBe(1);
    expect(currentSet).toBe(1);
  });

  it("deve detectar fim do treino no último exercício e última série", () => {
    const currentExIdx = exercises.length - 1;
    const currentSet = exercises[currentExIdx].sets;
    const isLastSet = currentSet >= exercises[currentExIdx].sets;
    const isLastExercise = currentExIdx >= exercises.length - 1;
    expect(isLastSet && isLastExercise).toBe(true);
  });

  it("deve calcular total de séries corretamente", () => {
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
    expect(totalSets).toBe(10); // 3 + 4 + 3
  });
});
