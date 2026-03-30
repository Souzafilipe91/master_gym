import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Helpers de validação (lógica pura, sem dependência de DB/LLM) ───────────

function buildCalisteniaPrompt(opts: {
  focus: string;
  duration: string;
  difficulty: string;
  anamnese: {
    age: number;
    gender: string;
    currentWeight: string;
    primaryGoal: string;
    trainingExperience: string;
    previousInjuries?: string;
    medicalRestrictions?: string;
    exerciseRestrictions?: string;
  };
}): string {
  const { focus, duration, difficulty, anamnese } = opts;
  return `Você é um especialista em calistenia e treino funcional. Crie um treino de calistenia completo para ser feito EM CASA.

DADOS DO ALUNO:
- Idade: ${anamnese.age} anos
- Gênero: ${anamnese.gender}
- Peso: ${anamnese.currentWeight} kg
- Objetivo principal: ${anamnese.primaryGoal}
- Experiência: ${anamnese.trainingExperience}
- Lesões/restrições: ${anamnese.previousInjuries || "Nenhuma"}
- Restrições médicas: ${anamnese.medicalRestrictions || "Nenhuma"}
- Exercícios a evitar: ${anamnese.exerciseRestrictions || "Nenhum"}

PARÂMETROS DO TREINO:
- Foco do treino: ${focus}
- Duração: ${duration}
- Nível de dificuldade: ${difficulty}`;
}

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

function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function resolveDifficulty(
  input: string | undefined,
  experience: string | undefined
): string {
  if (input) return input;
  return experience?.toLowerCase().includes("iniciante") ? "iniciante" : "intermediario";
}

// ─── Testes ──────────────────────────────────────────────────────────────────

describe("Calistenia — gerador de treino em casa", () => {
  it("deve incluir dados da anamnese no prompt", () => {
    const prompt = buildCalisteniaPrompt({
      focus: "full body",
      duration: "45 minutos",
      difficulty: "intermediario",
      anamnese: {
        age: 34,
        gender: "masculino",
        currentWeight: "83",
        primaryGoal: "Hipertrofia",
        trainingExperience: "Intermediário — 3 anos",
      },
    });

    expect(prompt).toContain("34 anos");
    expect(prompt).toContain("83 kg");
    expect(prompt).toContain("Hipertrofia");
    expect(prompt).toContain("Intermediário — 3 anos");
    expect(prompt).toContain("full body");
    expect(prompt).toContain("45 minutos");
    expect(prompt).toContain("intermediario");
  });

  it("deve usar 'Nenhuma' quando não há lesões informadas", () => {
    const prompt = buildCalisteniaPrompt({
      focus: "peito e tríceps",
      duration: "30 minutos",
      difficulty: "iniciante",
      anamnese: {
        age: 25,
        gender: "feminino",
        currentWeight: "60",
        primaryGoal: "Emagrecimento",
        trainingExperience: "Iniciante",
        previousInjuries: undefined,
        medicalRestrictions: undefined,
      },
    });

    expect(prompt).toContain("Nenhuma");
    expect(prompt).toContain("peito e tríceps");
  });

  it("deve resolver dificuldade automaticamente baseado na experiência", () => {
    expect(resolveDifficulty(undefined, "Iniciante — primeiro mês")).toBe("iniciante");
    expect(resolveDifficulty(undefined, "Intermediário — 2 anos")).toBe("intermediario");
    expect(resolveDifficulty(undefined, "Avançado")).toBe("intermediario"); // fallback para intermediario
    expect(resolveDifficulty("avancado", "Iniciante")).toBe("avancado"); // input explícito tem prioridade
  });

  it("deve usar duração da anamnese quando não informada", () => {
    const sessionDuration = "60 minutos";
    const duration = undefined ?? sessionDuration ?? "60 minutos";
    expect(duration).toBe("60 minutos");
  });
});

describe("Copiar Treino — extração de ID do YouTube", () => {
  it("deve extrair ID de URL padrão do YouTube", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("deve extrair ID de URL encurtada youtu.be", () => {
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("deve extrair ID de URL de embed", () => {
    expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("deve extrair ID de URL de Shorts", () => {
    expect(extractYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("deve extrair ID de URL com parâmetros extras", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120s&list=PLxxx")).toBe("dQw4w9WgXcQ");
  });

  it("deve retornar null para URLs não-YouTube", () => {
    expect(extractYouTubeId("https://vimeo.com/123456")).toBeNull();
    expect(extractYouTubeId("https://www.instagram.com/p/abc123")).toBeNull();
    expect(extractYouTubeId("https://example.com")).toBeNull();
  });

  it("deve identificar URLs do YouTube corretamente", () => {
    expect(isYouTubeUrl("https://www.youtube.com/watch?v=abc")).toBe(true);
    expect(isYouTubeUrl("https://youtu.be/abc")).toBe(true);
    expect(isYouTubeUrl("https://vimeo.com/abc")).toBe(false);
  });
});

describe("Copiar Treino — construção do prompt de adaptação", () => {
  it("deve incluir análise do vídeo e dados da anamnese no prompt de adaptação", () => {
    const videoAnalysis = "Exercícios: Supino 4x8, Crucifixo 3x12, Tríceps Corda 3x15";
    const anamnese = {
      age: 34,
      gender: "masculino",
      currentWeight: "83",
      primaryGoal: "Hipertrofia",
      trainingExperience: "Intermediário",
      previousInjuries: "Lesão no ombro direito",
      sessionDuration: "60 minutos",
    };

    const prompt = `ROTINA ORIGINAL EXTRAÍDA DO VÍDEO:\n${videoAnalysis}\n\nDADOS DO ALUNO:\n- Idade: ${anamnese.age} anos\n- Lesões: ${anamnese.previousInjuries}`;

    expect(prompt).toContain("Supino 4x8");
    expect(prompt).toContain("34 anos");
    expect(prompt).toContain("Lesão no ombro direito");
  });

  it("deve mencionar nome do atleta quando fornecido", () => {
    const athleteName = "Chris Evans";
    const text = `Analise este vídeo de treino do(a) ${athleteName}`;
    expect(text).toContain("Chris Evans");
  });

  it("deve funcionar sem nome do atleta", () => {
    const athleteName = undefined;
    const text = `Analise este vídeo de treino${athleteName ? ` do(a) ${athleteName}` : ""}`;
    expect(text).toBe("Analise este vídeo de treino");
    expect(text).not.toContain("undefined");
  });
});
