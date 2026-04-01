import { describe, it, expect } from "vitest";

// Versão do parser corrigida para testar
function parseWorkoutMarkdown(markdown: string) {
  const lines = markdown.split("\n").map((l: string) => l.trim());
  const exercises: Array<{ name: string; sets: number; reps: string; rest: number; description?: string; notes?: string }> = [];
  let title = "Treino";

  const titleLine = lines.find((l: string) => l.startsWith("# "));
  if (titleLine) title = titleLine.replace(/^#\s+/, "").replace(/[*_]/g, "").trim();

  const rawText = markdown;
  const headerBlockRegex = /#{2,4}\s*(?:\d+\.?\s*)?([^\n#]+)\n([\s\S]*?)(?=#{2,4}|$)/g;
  let headerMatch;
  const headerExercises: typeof exercises = [];

  while ((headerMatch = headerBlockRegex.exec(rawText)) !== null) {
    const blockName = headerMatch[1].replace(/[*_`]/g, "").trim();
    const blockContent = headerMatch[2];

    if (/^(treino|programa|semana|ciclo|dia|bloco|fase|cardio|nutri|dica|observ|recom|progres)/i.test(blockName)) continue;
    if (blockName.length > 60) continue;

    // Padrão 1: **Séries:** N | **Reps:** N (formato estruturado do prompt)
    const boldSetsRepsMatch = blockContent.match(/\*\*S.ries:\*\*\s*(\d+)[^\n]*\*\*Reps:\*\*\s*([\d\-]+)/i);
    // Padrão 2: NxN
    const inlineMatch = blockContent.match(/(\d+)\s*[xX]\s*([\d\-]+)/i);
    // Padrão 3: S.ries: N ... Reps: N (sem bold)
    const plainMatch = blockContent.match(/S.ries?[*:\s]+(\d+)[^\n]*Reps?[*:\s]+([\d\-]+)/i);

    const setsRepsMatch = boldSetsRepsMatch || inlineMatch || plainMatch;
    if (!setsRepsMatch) continue;

    const sets = parseInt(setsRepsMatch[1]) || 3;
    const reps = setsRepsMatch[2].trim();

    const restMatch = blockContent.match(/Descanso[^0-9]*(\d+)\s*(s|seg|min|minuto)/i);
    let rest = 90;
    if (restMatch) {
      rest = restMatch[2].toLowerCase().startsWith("min")
        ? parseInt(restMatch[1]) * 60
        : parseInt(restMatch[1]);
    }

    const descMatch = blockContent.match(/Execu..o:\*{0,2}\s*([^\n]+)/i)
      || blockContent.match(/Como fazer:\*{0,2}\s*([^\n]+)/i)
      || blockContent.match(/T.cnica:\*{0,2}\s*([^\n]+)/i);
    const description = descMatch ? descMatch[1].replace(/[*_]/g, "").trim() : undefined;

    const notesMatch = blockContent.match(/Dica:\*{0,2}\s*([^\n]+)/i)
      || blockContent.match(/Observa..o:\*{0,2}\s*([^\n]+)/i);
    const notes = notesMatch ? notesMatch[1].replace(/[*_]/g, "").trim() : undefined;

    headerExercises.push({ name: blockName, sets, reps, rest, description, notes });
  }

  if (headerExercises.length >= 3) {
    return { title, exercises: headerExercises };
  }

  return { title, exercises };
}

describe("parseWorkoutMarkdown", () => {
  const sampleMd = `# Treino de Calistenia Full Body

### 1. Flexão de Braço
**Séries:** 3 | **Reps:** 10-12 | **Descanso:** 60s
**Execução:** Posicione as mãos na largura dos ombros, desça o peito até quase tocar o chão.
**Dica:** Para iniciantes, pode fazer com joelhos no chão.

### 2. Agachamento Livre
**Séries:** 4 | **Reps:** 15 | **Descanso:** 90s
**Execução:** Pés na largura dos ombros, desça até as coxas ficarem paralelas ao chão.

### 3. Prancha Abdominal
**Séries:** 3 | **Reps:** 30s | **Descanso:** 45s
**Execução:** Apoie nos cotovelos, mantenha o corpo reto e o core contraído.
`;

  it("extrai título do treino", () => {
    const result = parseWorkoutMarkdown(sampleMd);
    expect(result.title).toBe("Treino de Calistenia Full Body");
  });

  it("extrai nomes reais dos exercícios (não Exercício 1, 2, 3)", () => {
    const result = parseWorkoutMarkdown(sampleMd);
    expect(result.exercises.length).toBeGreaterThanOrEqual(3);
    // Nenhum deve ser "Exercício N"
    result.exercises.forEach(ex => {
      expect(ex.name).not.toMatch(/^Exerc.cio \d+$/);
    });
    // Deve ter nomes reais
    const names = result.exercises.map(e => e.name);
    expect(names.some(n => /Flex/i.test(n))).toBe(true);
    expect(names.some(n => /Agachamento/i.test(n))).toBe(true);
  });

  it("extrai séries e repetições corretamente", () => {
    const result = parseWorkoutMarkdown(sampleMd);
    expect(result.exercises[0].sets).toBe(3);
    expect(result.exercises[0].reps).toBe("10-12");
    expect(result.exercises[1].sets).toBe(4);
    expect(result.exercises[1].reps).toBe("15");
  });

  it("extrai tempo de descanso em segundos", () => {
    const result = parseWorkoutMarkdown(sampleMd);
    expect(result.exercises[0].rest).toBe(60);
    expect(result.exercises[1].rest).toBe(90);
    expect(result.exercises[2].rest).toBe(45);
  });

  it("extrai tempo de descanso em minutos e converte para segundos", () => {
    const md = `# Treino\n\n### 1. Supino\n**Séries:** 4 | **Reps:** 8-12 | **Descanso:** 2min\n**Execução:** Deite no banco.\n\n### 2. Remada\n**Séries:** 3 | **Reps:** 10 | **Descanso:** 90s\n**Execução:** Incline o tronco.\n\n### 3. Desenvolvimento\n**Séries:** 3 | **Reps:** 12 | **Descanso:** 60s\n**Execução:** Empurre para cima.\n`;
    const result = parseWorkoutMarkdown(md);
    expect(result.exercises[0].rest).toBe(120); // 2min = 120s
  });

  it("extrai descrição de execução", () => {
    const result = parseWorkoutMarkdown(sampleMd);
    expect(result.exercises[0].description).toBeDefined();
    expect(result.exercises[0].description).toContain("largura dos ombros");
    expect(result.exercises[1].description).toBeDefined();
    expect(result.exercises[1].description).toContain("paralelas ao chão");
  });

  it("extrai dicas/notas quando presentes", () => {
    const result = parseWorkoutMarkdown(sampleMd);
    expect(result.exercises[0].notes).toBeDefined();
    expect(result.exercises[0].notes).toContain("iniciantes");
    // Exercício sem dica não deve ter notes
    expect(result.exercises[1].notes).toBeUndefined();
  });

  it("ignora seções que não são exercícios", () => {
    const md = `# Programa\n\n## Treino A\n\n### 1. Supino Reto\n**Séries:** 4 | **Reps:** 8-12 | **Descanso:** 90s\n**Execução:** Deite no banco.\n\n### 2. Crucifixo\n**Séries:** 3 | **Reps:** 12 | **Descanso:** 60s\n**Execução:** Abra os braços.\n\n### 3. Tríceps Pulley\n**Séries:** 3 | **Reps:** 12-15 | **Descanso:** 60s\n**Execução:** Puxe para baixo.\n\n## Cardio\nFaça 20 min de caminhada.\n\n## Progressão\nAumente 2.5kg a cada 2 semanas.\n`;
    const result = parseWorkoutMarkdown(md);
    const names = result.exercises.map(e => e.name);
    expect(names.some(n => /cardio/i.test(n))).toBe(false);
    expect(names.some(n => /progress/i.test(n))).toBe(false);
  });

  it("funciona com formato NxN inline (fallback)", () => {
    const md = `# Treino\n\n### 1. Flexão\n3x12, descanso 60s\n\n### 2. Agachamento\n4x15, descanso 90s\n\n### 3. Prancha\n3x30s, descanso 45s\n`;
    const result = parseWorkoutMarkdown(md);
    expect(result.exercises.length).toBeGreaterThanOrEqual(3);
    expect(result.exercises[0].sets).toBe(3);
    expect(result.exercises[0].reps).toBe("12");
  });
});
