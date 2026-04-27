// Utilitário compartilhado para extrair dias de um treino IA em markdown

export interface WorkoutDayInfo {
  label: string;       // ex: "Dia A", "Segunda-feira"
  letter: string;      // ex: "A", "B", "1"
  exercises: string[]; // nomes dos exercícios
  setsInfo: string[];  // ex: "4x8-12"
}

/**
 * Extrai blocos de dias de um markdown de treino IA.
 * Retorna array vazio se não detectar pelo menos 2 dias.
 */
export function parseWorkoutDays(markdown: string): WorkoutDayInfo[] {
  const days: WorkoutDayInfo[] = [];

  // Padrão: ## Dia A, ## Segunda-feira, ## Treino 1, ## Bloco A, etc.
  const dayHeaderRegex = /^#{1,3}\s*((?:Dia|Treino|Bloco|Semana|Segunda|Ter[cç]a|Quarta|Quinta|Sexta|S[aá]bado|Domingo)[^\n]*)/gim;
  const dayMatches: { label: string; index: number }[] = [];
  let m;
  while ((m = dayHeaderRegex.exec(markdown)) !== null) {
    const label = m[1].replace(/[*_#]/g, "").trim();
    // Ignorar se é título principal do treino
    if (/programa|plano|treino de/i.test(label) && dayMatches.length === 0) continue;
    dayMatches.push({ label, index: m.index });
  }

  if (dayMatches.length < 2) return [];

  // Letras para os dias
  const letters = ["A", "B", "C", "D", "E", "F", "G"];

  for (let i = 0; i < dayMatches.length; i++) {
    const start = dayMatches[i].index;
    const end = i + 1 < dayMatches.length ? dayMatches[i + 1].index : markdown.length;
    const block = markdown.slice(start, end);

    // Extrair nomes de exercícios do bloco
    const exerciseNames: string[] = [];
    const setsInfo: string[] = [];

    // Padrão: ### N. Nome do Exercício
    const headerExRegex = /#{2,4}\s*(?:\d+\.?\s*)([^\n#\d][^\n]*)/g;
    let ex;
    while ((ex = headerExRegex.exec(block)) !== null) {
      const name = ex[1].replace(/[*_]/g, "").trim();
      if (name && name.length > 2 && !/^(dia|treino|bloco|semana)/i.test(name)) {
        exerciseNames.push(name);
        // Tentar capturar séries/reps na próxima linha
        const afterName = block.slice(ex.index + ex[0].length, ex.index + ex[0].length + 200);
        const setsMatch = afterName.match(/S.ries[^:]*:\*{0,2}\s*(\d+).*?(?:Reps?|Repeti)[^:]*:\*{0,2}\s*([\d\-]+)/i);
        if (setsMatch) {
          setsInfo.push(`${setsMatch[1]}x${setsMatch[2]}`);
        } else {
          const altMatch = afterName.match(/(\d+)[x×](\d[\d\-]*)/i);
          setsInfo.push(altMatch ? `${altMatch[1]}x${altMatch[2]}` : "");
        }
      }
    }

    // Fallback: padrão - **Nome** — NxM
    if (exerciseNames.length === 0) {
      const bulletRegex = /[-*]\s*\*{1,2}([^*\n]+)\*{1,2}[^\n]*/g;
      let b;
      while ((b = bulletRegex.exec(block)) !== null) {
        const name = b[1].replace(/[*_]/g, "").trim();
        if (name && name.length > 2) {
          exerciseNames.push(name);
          const setsMatch = b[0].match(/(\d+)[x×](\d[\d\-]*)/i);
          setsInfo.push(setsMatch ? `${setsMatch[1]}x${setsMatch[2]}` : "");
        }
      }
    }

    if (exerciseNames.length > 0) {
      // Extrair letra do label (ex: "Dia A" → "A", "Treino 1" → "1")
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
