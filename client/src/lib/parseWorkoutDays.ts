// Utilitário compartilhado para extrair dias de um treino IA em markdown

export interface WorkoutDayInfo {
  label: string;       // ex: "Sessão A: Peito", "Dia B"
  letter: string;      // ex: "A", "B", "1"
  exercises: string[]; // nomes dos exercícios
  setsInfo: string[];  // ex: "4x8-12"
}

/**
 * Extrai blocos de dias de um markdown de treino IA.
 * Suporta múltiplos formatos gerados pelo LLM:
 *   - ## Dia A / ### Dia B
 *   - ## Sessão A: Peito / **Sessão A:** Peito
 *   - **Treino A** / **Bloco 1**
 *   - Segunda-feira / Terça-feira
 *   - 1. Supino... (lista numerada de exercícios)
 * Retorna array vazio se não detectar pelo menos 2 dias.
 */
export function parseWorkoutDays(markdown: string): WorkoutDayInfo[] {
  const days: WorkoutDayInfo[] = [];

  // Padrão ampliado: detecta cabeçalhos markdown (# ## ###) OU negrito (**texto**)
  // que comecem com palavras-chave de dia/sessão/bloco/treino
  const DAY_KEYWORDS = [
    "Sess[aã]o",
    "Dia",
    "Treino",
    "Bloco",
    "Semana",
    "Segunda",
    "Ter[cç][aã]",
    "Quarta",
    "Quinta",
    "Sexta",
    "S[aá]bado",
    "Domingo",
    "Fase",
    "Etapa",
  ].join("|");

  // Regex 1: cabeçalhos markdown (## Sessão A, ### Dia B, etc.)
  const headerRegex = new RegExp(
    `^#{1,4}\\s*((?:${DAY_KEYWORDS})[^\\n]*)`,
    "gim"
  );

  // Regex 2: negrito no início de linha (**Sessão A:** ou **Treino A**)
  const boldRegex = new RegExp(
    `^\\*{1,2}((?:${DAY_KEYWORDS})[^*\\n]*)\\*{1,2}[:\\s]*([^\\n]*)`,
    "gim"
  );

  const dayMatches: { label: string; index: number }[] = [];

  // Coletar todos os matches de cabeçalho
  let m: RegExpExecArray | null;
  while ((m = headerRegex.exec(markdown)) !== null) {
    const label = m[1].replace(/[*_#:]/g, "").trim();
    if (!label || label.length < 3) continue;
    // Ignorar títulos gerais do programa
    if (/^(programa|plano|treino de|programa de)/i.test(label) && dayMatches.length === 0) continue;
    dayMatches.push({ label, index: m.index });
  }

  // Se não encontrou com cabeçalhos, tentar negrito
  if (dayMatches.length < 2) {
    dayMatches.length = 0;
    while ((m = boldRegex.exec(markdown)) !== null) {
      const rawLabel = (m[1] + " " + (m[2] || "")).replace(/[*_#:]/g, "").trim();
      const label = rawLabel.replace(/\s+/g, " ").trim();
      if (!label || label.length < 3) continue;
      if (/^(programa|plano|treino de)/i.test(label) && dayMatches.length === 0) continue;
      dayMatches.push({ label, index: m.index });
    }
  }

  if (dayMatches.length < 2) return [];

  // Letras para os dias
  const letters = ["A", "B", "C", "D", "E", "F", "G"];

  for (let i = 0; i < dayMatches.length; i++) {
    const start = dayMatches[i].index;
    const end = i + 1 < dayMatches.length ? dayMatches[i + 1].index : markdown.length;
    const block = markdown.slice(start, end);

    const exerciseNames: string[] = [];
    const setsInfo: string[] = [];

    // Estratégia 1: exercícios com cabeçalho ### N. Nome
    const headerExRegex = /#{2,4}\s*(?:\d+\.?\s*)([^\n#\d][^\n]*)/g;
    let ex: RegExpExecArray | null;
    while ((ex = headerExRegex.exec(block)) !== null) {
      const name = ex[1].replace(/[*_]/g, "").trim();
      if (name && name.length > 2 && !/^(sess[aã]o|dia|treino|bloco|semana)/i.test(name)) {
        exerciseNames.push(name);
        const afterName = block.slice(ex.index + ex[0].length, ex.index + ex[0].length + 300);
        const setsMatch = afterName.match(/S.ries[^:]*:\*{0,2}\s*(\d+).*?(?:Reps?|Repeti)[^:]*:\*{0,2}\s*([\d\-]+)/i);
        if (setsMatch) {
          setsInfo.push(`${setsMatch[1]}x${setsMatch[2]}`);
        } else {
          const altMatch = afterName.match(/(\d+)[x×](\d[\d\-]*)/i);
          setsInfo.push(altMatch ? `${altMatch[1]}x${altMatch[2]}` : "");
        }
      }
    }

    // Estratégia 2: lista numerada "1. Nome do Exercício" ou "**1. Nome**"
    if (exerciseNames.length === 0) {
      const numberedRegex = /^\d+\.\s+\*{0,2}([^\n*]+)\*{0,2}/gm;
      let nb: RegExpExecArray | null;
      while ((nb = numberedRegex.exec(block)) !== null) {
        const name = nb[1].replace(/[*_]/g, "").trim();
        if (name && name.length > 2 && !/^(sess[aã]o|dia|treino|bloco)/i.test(name)) {
          exerciseNames.push(name);
          // Tentar pegar séries/reps na mesma linha ou próxima
          const afterName = block.slice(nb.index + nb[0].length, nb.index + nb[0].length + 300);
          const setsMatch = afterName.match(/(\d+)[x×](\d[\d\-]*)/i);
          setsInfo.push(setsMatch ? `${setsMatch[1]}x${setsMatch[2]}` : "");
        }
      }
    }

    // Estratégia 3: bullet com negrito "- **Nome**" ou "* **Nome**"
    if (exerciseNames.length === 0) {
      const bulletRegex = /^[-*]\s+\*{1,2}([^*\n]+)\*{1,2}/gm;
      let b: RegExpExecArray | null;
      while ((b = bulletRegex.exec(block)) !== null) {
        const name = b[1].replace(/[*_]/g, "").trim();
        if (name && name.length > 2) {
          exerciseNames.push(name);
          const setsMatch = b[0].match(/(\d+)[x×](\d[\d\-]*)/i);
          setsInfo.push(setsMatch ? `${setsMatch[1]}x${setsMatch[2]}` : "");
        }
      }
    }

    // Estratégia 4: linhas com "Séries:" como indicador de exercício
    if (exerciseNames.length === 0) {
      // Pegar o nome da linha anterior a "Séries:"
      const seriesLines = block.split("\n");
      for (let j = 1; j < seriesLines.length; j++) {
        if (/S.ries[:\s]/i.test(seriesLines[j])) {
          const nameLine = seriesLines[j - 1].replace(/[*_#\d.]/g, "").trim();
          if (nameLine && nameLine.length > 3) {
            exerciseNames.push(nameLine);
            const setsMatch = seriesLines[j].match(/(\d+)[x×](\d[\d\-]*)/i);
            setsInfo.push(setsMatch ? `${setsMatch[1]}x${setsMatch[2]}` : "");
          }
        }
      }
    }

    if (exerciseNames.length > 0) {
      // Extrair letra do label (ex: "Sessão A" → "A", "Treino 1" → "1")
      const letterMatch = dayMatches[i].label.match(/\b([A-Z]|\d)\b/);
      const letter = letterMatch ? letterMatch[1] : letters[i] || String(i + 1);

      days.push({
        label: dayMatches[i].label,
        letter,
        exercises: exerciseNames,
        setsInfo,
      });
    }
  }

  return days;
}
