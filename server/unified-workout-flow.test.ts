import { describe, it, expect, beforeEach } from "vitest";

// ─── Testes do parser de markdown para treinos IA ────────────────────────────

function parseWorkoutMarkdown(markdown: string) {
  const lines = markdown.split("\n").map((l: string) => l.trim()).filter(Boolean);
  const exercises: Array<{ name: string; sets: number; reps: string; rest: number }> = [];
  let title = "Treino";

  for (const line of lines) {
    if (line.startsWith("# ")) {
      title = line.replace(/^#\s+/, "");
      continue;
    }
    const exerciseMatch = line.match(/[-*]?\s*\*{1,2}([^*:]+)\*{0,2}[:\s]+(\d+)\s*[xX×]\s*([^\s,.(]+)/i);
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
    ["Aquecimento", "Exercício 1", "Exercício 2", "Exercício 3", "Alongamento"].forEach((name, i) => {
      exercises.push({ name, sets: i === 0 || i === 4 ? 1 : 3, reps: "10-12", rest: 60 });
    });
  }

  return { title, exercises };
}

describe("parseWorkoutMarkdown", () => {
  it("extrai título do markdown", () => {
    const md = "# Treino Full Body\n- **Flexão**: 3x12";
    const result = parseWorkoutMarkdown(md);
    expect(result.title).toBe("Treino Full Body");
  });

  it("extrai exercícios com formato padrão", () => {
    const md = "# Treino\n- **Flexão**: 3x12\n- **Agachamento**: 4x15";
    const result = parseWorkoutMarkdown(md);
    expect(result.exercises).toHaveLength(2);
    expect(result.exercises[0].name).toBe("Flexão");
    expect(result.exercises[0].sets).toBe(3);
    expect(result.exercises[0].reps).toBe("12");
    expect(result.exercises[1].name).toBe("Agachamento");
    expect(result.exercises[1].sets).toBe(4);
  });

  it("extrai tempo de descanso em segundos", () => {
    const md = "# Treino\n- **Flexão**: 3x12 — descanso: 90s";
    const result = parseWorkoutMarkdown(md);
    expect(result.exercises[0].rest).toBe(90);
  });

  it("extrai tempo de descanso em minutos", () => {
    const md = "# Treino\n- **Agachamento**: 4x8 — descanso: 2min";
    const result = parseWorkoutMarkdown(md);
    expect(result.exercises[0].rest).toBe(120);
  });

  it("usa fallback quando não parseia nenhum exercício", () => {
    const md = "Texto sem exercícios formatados";
    const result = parseWorkoutMarkdown(md);
    expect(result.exercises.length).toBeGreaterThan(0);
    expect(result.exercises[0].name).toBe("Aquecimento");
  });

  it("usa título padrão quando não há heading", () => {
    const md = "- **Flexão**: 3x12";
    const result = parseWorkoutMarkdown(md);
    expect(result.title).toBe("Treino");
  });
});

// ─── Testes de lógica de configuração de descanso ────────────────────────────

describe("getRestTimeFromSettings", () => {
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    localStorageMock = {};
  });

  function getRestTimeFromSettings(defaultSeconds: number): number {
    const saved = localStorageMock["gym-rest-time-seconds"];
    if (saved !== undefined) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 10) return parsed;
    }
    return defaultSeconds;
  }

  it("retorna o valor padrão quando não há configuração salva", () => {
    expect(getRestTimeFromSettings(90)).toBe(90);
  });

  it("retorna o valor do usuário quando configurado", () => {
    localStorageMock["gym-rest-time-seconds"] = "120";
    expect(getRestTimeFromSettings(90)).toBe(120);
  });

  it("ignora valores inválidos e usa o padrão", () => {
    localStorageMock["gym-rest-time-seconds"] = "abc";
    expect(getRestTimeFromSettings(90)).toBe(90);
  });

  it("ignora valores menores que 10 segundos", () => {
    localStorageMock["gym-rest-time-seconds"] = "5";
    expect(getRestTimeFromSettings(90)).toBe(90);
  });

  it("aceita valor mínimo de 10 segundos", () => {
    localStorageMock["gym-rest-time-seconds"] = "10";
    expect(getRestTimeFromSettings(90)).toBe(10);
  });
});

// ─── Testes de lógica de progresso do treino ─────────────────────────────────

describe("workout progress logic", () => {
  it("calcula progresso corretamente", () => {
    const exercises = [
      { name: "Flexão", sets: 3, reps: "12", rest: 60 },
      { name: "Agachamento", sets: 4, reps: "15", rest: 90 },
    ];
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
    expect(totalSets).toBe(7);

    const completedSets = new Set(["0-1", "0-2", "0-3"]);
    const progress = (completedSets.size / totalSets) * 100;
    expect(Math.round(progress)).toBe(43);
  });

  it("detecta último exercício e última série", () => {
    const exercises = [
      { name: "Flexão", sets: 3, reps: "12", rest: 60 },
      { name: "Agachamento", sets: 2, reps: "15", rest: 90 },
    ];
    const currentExIdx = 1;
    const currentSet = 2;
    const isLastSet = currentSet >= exercises[currentExIdx].sets;
    const isLastExercise = currentExIdx >= exercises.length - 1;
    expect(isLastSet).toBe(true);
    expect(isLastExercise).toBe(true);
  });

  it("avança para próxima série corretamente", () => {
    const exercises = [{ name: "Flexão", sets: 3, reps: "12", rest: 60 }];
    let currentSet = 1;
    const isLastSet = currentSet >= exercises[0].sets;
    expect(isLastSet).toBe(false);
    currentSet += 1;
    expect(currentSet).toBe(2);
  });

  it("avança para próximo exercício quando série é a última", () => {
    const exercises = [
      { name: "Flexão", sets: 3, reps: "12", rest: 60 },
      { name: "Agachamento", sets: 2, reps: "15", rest: 90 },
    ];
    let currentExIdx = 0;
    let currentSet = 3;
    const isLastSet = currentSet >= exercises[currentExIdx].sets;
    expect(isLastSet).toBe(true);
    currentExIdx += 1;
    currentSet = 1;
    expect(currentExIdx).toBe(1);
    expect(currentSet).toBe(1);
  });
});

// ─── Testes de validação de URL do YouTube ───────────────────────────────────

describe("YouTube URL validation", () => {
  function extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  it("extrai ID de URL padrão do YouTube", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extrai ID de URL curta youtu.be", () => {
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extrai ID de URL de Shorts", () => {
    expect(extractYouTubeId("https://www.youtube.com/shorts/abc123")).toBe("abc123");
  });

  it("retorna null para URL inválida", () => {
    expect(extractYouTubeId("https://vimeo.com/123456")).toBeNull();
    expect(extractYouTubeId("não é uma url")).toBeNull();
  });
});
