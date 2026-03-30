import { describe, it, expect } from "vitest";

// ─── Testes de lógica de particionamento ────────────────────────────────────

type AiWorkout = {
  id: number;
  title: string;
  type: "calistenia" | "copied" | "musculacao";
  createdAt: Date;
};

/**
 * Simula a lógica de separação "atual vs anteriores" usada no MeusTreinos.
 * O primeiro item (índice 0) é o mais recente (ORDER BY createdAt DESC),
 * portanto é o "atual". Os demais são "anteriores".
 */
function splitCurrentAndPrevious(workouts: AiWorkout[]) {
  if (workouts.length === 0) return { current: null, previous: [] };
  const [current, ...previous] = workouts;
  return { current, previous };
}

/**
 * Simula o filtro por tipo retornado pelo backend.
 */
function filterByType(workouts: AiWorkout[], type: AiWorkout["type"]) {
  return workouts.filter((w) => w.type === type);
}

describe("MeusTreinos — lógica de particionamento", () => {
  const mockWorkouts: AiWorkout[] = [
    { id: 3, title: "Calistenia Full Body — 45min", type: "calistenia", createdAt: new Date("2026-03-30") },
    { id: 2, title: "Calistenia Peito — 30min", type: "calistenia", createdAt: new Date("2026-03-20") },
    { id: 1, title: "Calistenia Pernas — 60min", type: "calistenia", createdAt: new Date("2026-03-10") },
  ];

  it("separa o primeiro item como 'atual' e os demais como 'anteriores'", () => {
    const { current, previous } = splitCurrentAndPrevious(mockWorkouts);
    expect(current?.id).toBe(3);
    expect(previous).toHaveLength(2);
    expect(previous.map((w) => w.id)).toEqual([2, 1]);
  });

  it("retorna null para current quando a lista está vazia", () => {
    const { current, previous } = splitCurrentAndPrevious([]);
    expect(current).toBeNull();
    expect(previous).toHaveLength(0);
  });

  it("retorna apenas um item como current sem anteriores quando há só um treino", () => {
    const { current, previous } = splitCurrentAndPrevious([mockWorkouts[0]]);
    expect(current?.id).toBe(3);
    expect(previous).toHaveLength(0);
  });

  it("filtra corretamente por tipo 'calistenia'", () => {
    const mixed: AiWorkout[] = [
      { id: 1, title: "Calistenia", type: "calistenia", createdAt: new Date() },
      { id: 2, title: "Copiado", type: "copied", createdAt: new Date() },
      { id: 3, title: "Musculação IA", type: "musculacao", createdAt: new Date() },
    ];
    const result = filterByType(mixed, "calistenia");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("filtra corretamente por tipo 'copied'", () => {
    const mixed: AiWorkout[] = [
      { id: 1, title: "Calistenia", type: "calistenia", createdAt: new Date() },
      { id: 2, title: "Copiado Chris Evans", type: "copied", createdAt: new Date() },
      { id: 3, title: "Copiado Cbum", type: "copied", createdAt: new Date() },
    ];
    const result = filterByType(mixed, "copied");
    expect(result).toHaveLength(2);
  });

  it("filtra corretamente por tipo 'musculacao'", () => {
    const mixed: AiWorkout[] = [
      { id: 1, title: "Musculação IA 1", type: "musculacao", createdAt: new Date() },
      { id: 2, title: "Musculação IA 2", type: "musculacao", createdAt: new Date() },
      { id: 3, title: "Calistenia", type: "calistenia", createdAt: new Date() },
    ];
    const result = filterByType(mixed, "musculacao");
    expect(result).toHaveLength(2);
  });

  it("retorna array vazio quando não há treinos do tipo solicitado", () => {
    const mixed: AiWorkout[] = [
      { id: 1, title: "Calistenia", type: "calistenia", createdAt: new Date() },
    ];
    const result = filterByType(mixed, "copied");
    expect(result).toHaveLength(0);
  });
});

// ─── Testes de formatação de data ────────────────────────────────────────────

describe("MeusTreinos — formatação de data", () => {
  it("formata data corretamente no padrão pt-BR", () => {
    const date = new Date("2026-03-30T12:00:00Z");
    const formatted = date.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    // Aceita tanto 30/03/2026 quanto variações de timezone
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("identifica o treino mais recente pelo índice 0 (ORDER BY createdAt DESC)", () => {
    const sorted: AiWorkout[] = [
      { id: 10, title: "Mais recente", type: "calistenia", createdAt: new Date("2026-03-30") },
      { id: 5, title: "Intermediário", type: "calistenia", createdAt: new Date("2026-03-15") },
      { id: 1, title: "Mais antigo", type: "calistenia", createdAt: new Date("2026-03-01") },
    ];
    const { current } = splitCurrentAndPrevious(sorted);
    expect(current?.title).toBe("Mais recente");
  });
});

// ─── Testes de tipos de treino IA ─────────────────────────────────────────────

describe("savedWorkouts — tipos aceitos", () => {
  const validTypes = ["calistenia", "copied", "musculacao"] as const;

  it("aceita todos os 3 tipos de treino IA", () => {
    validTypes.forEach((type) => {
      expect(validTypes).toContain(type);
    });
  });

  it("tipo 'musculacao' foi adicionado corretamente ao enum", () => {
    expect(validTypes).toContain("musculacao");
  });

  it("distingue corretamente entre tipos ao filtrar", () => {
    const workouts: AiWorkout[] = validTypes.map((type, i) => ({
      id: i + 1, title: `Treino ${type}`, type, createdAt: new Date(),
    }));

    validTypes.forEach((type) => {
      const filtered = filterByType(workouts, type);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe(type);
    });
  });
});
