import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Check, Clock, Dumbbell, SkipForward,
  Trophy, TrendingUp, Settings, List, ChevronRight, Play, ChevronDown, ChevronUp, Info
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { requestNotificationPermission, notifyRestEnd } from "@/lib/notifications";
import { useHaptic } from "@/hooks/useHaptic";
import ExerciseCard from "@/components/ExerciseCard";

// ─── Banco de descrições de exercícios (fallback) ───────────────────────────

const EXERCISE_DESCRIPTIONS: Record<string, { description: string; notes?: string }> = {
  // Peito
  "supino reto": {
    description: "Deite no banco com os pés apoiados no chão. Segure a barra com pegada um pouco mais larga que os ombros. Desça a barra controlando até tocar levemente o peito, depois empurre de volta para cima estendendo os cotovelos. Expire ao subir.",
    notes: "Mantenha as escápulas retraídas e os cotovelos em ângulo de 45-75° em relação ao tronco."
  },
  "supino inclinado": {
    description: "Banco inclinado entre 30-45°. Segure a barra com pegada um pouco mais larga que os ombros. Desça a barra até a parte superior do peito, depois empurre de volta. O movimento foca na parte superior do peitoral.",
    notes: "Evite inclinar o banco acima de 45° para não transferir demais o esforço para os ombros."
  },
  "supino declinado": {
    description: "Banco declinado com os pés presos. Segure a barra com pegada larga. Desça até a parte inferior do peito e empurre de volta. Foca na porção inferior do peitoral.",
    notes: "Cuidado ao tirar e recolocar a barra — peça ajuda de um parceiro se necessário."
  },
  "supino com halteres": {
    description: "Deite no banco com um halter em cada mão ao nível do peito. Empurre os halteres para cima até os braços ficarem quase estendidos, depois desça controlando. Permite maior amplitude de movimento que a barra.",
    notes: "Mantenha os halteres alinhados com o peito — não deixe eles caírem para os lados."
  },
  "crucifixo": {
    description: "Deite no banco com halteres nas mãos. Braços levemente flexionados, abra os braços em arco amplo até sentir o alongamento no peito, depois feche voltando ao ponto inicial. Movimento parecido com 'abraçar uma árvore'.",
    notes: "Não estique demais os cotovelos — mantenha uma leve flexão para proteger as articulações."
  },
  "crucifixo inclinado": {
    description: "Banco inclinado entre 30-45°. Segure halteres com braços levemente flexionados. Abra em arco amplo até sentir o alongamento na parte superior do peito, depois feche os braços.",
    notes: "Controle a descida — não deixe os halteres caírem rapidamente."
  },
  "voador": {
    description: "Sente-se na máquina com as costas apoiadas. Posicione os antebraços nos apoios. Feche os braços à frente contraindo o peito, depois abra controlando o movimento.",
    notes: "Não abra demais para evitar lesão no ombro — pare quando sentir o alongamento."
  },
  "flexão": {
    description: "Apoie as mãos no chão na largura dos ombros e os pés juntos. Mantenha o corpo reto. Dobre os cotovelos descendo o peito até quase tocar o chão, depois empurre de volta. Expire ao subir.",
    notes: "Para facilitar, apoie os joelhos no chão. Para dificultar, eleve os pés numa superfície."
  },
  "flexão de braço": {
    description: "Apoie as mãos no chão na largura dos ombros e os pés juntos. Mantenha o corpo reto. Dobre os cotovelos descendo o peito até quase tocar o chão, depois empurre de volta. Expire ao subir.",
    notes: "Para facilitar, apoie os joelhos no chão. Para dificultar, eleve os pés numa superfície."
  },
  // Costas
  "puxada frontal": {
    description: "Sente-se na máquina e segure a barra com pegada pronada mais larga que os ombros. Puxe a barra até a altura do queixo enquanto retrai as escápulas. Controle a subida.",
    notes: "Não balance o tronco — o movimento deve ser feito pelos braços e costas."
  },
  "pulldown": {
    description: "Sente-se na máquina e segure a barra com pegada pronada mais larga que os ombros. Puxe a barra até a altura do queixo enquanto retrai as escápulas. Controle a subida.",
    notes: "Não balance o tronco — o movimento deve ser feito pelos braços e costas."
  },
  "remada curvada": {
    description: "Em pé com os pés afastados na largura dos ombros. Incline o tronco para frente mantendo a coluna neutra. Segure a barra com pegada pronada. Puxe a barra em direção ao abdome retraindo as escápulas, depois desça controlando.",
    notes: "Mantenha a coluna neutra — não arredonde as costas. O tronco deve ficar quase paralelo ao chão."
  },
  "remada unilateral": {
    description: "Apoie um joelho e a mão do mesmo lado num banco. Com a outra mão segure o halter. Puxe o halter em direção ao quadril retraindo a escápula, depois desça controlando. Alterne os lados.",
    notes: "Mantenha as costas paralelas ao chão durante o movimento."
  },
  "serrote": {
    description: "Apoie um joelho e a mão do mesmo lado num banco. Com a outra mão segure o halter. Puxe o halter em direção ao quadril retraindo a escápula, depois desça controlando. Alterne os lados.",
    notes: "Mantenha as costas paralelas ao chão. Foca no grande dorsal e romboides."
  },
  "barra fixa": {
    description: "Segure a barra com pegada pronada mais larga que os ombros. Puxe o corpo para cima até o queixo passar da barra, retraindo as escápulas. Desça controlando até os braços ficarem estendidos.",
    notes: "Se não conseguir fazer completo, use elástico de assistência ou máquina graviton."
  },
  "puxada supinada": {
    description: "Sente-se na máquina e segure a barra com pegada supinada (palmas para você) na largura dos ombros. Puxe a barra até o peito retraindo as escápulas. Controle a subida.",
    notes: "A pegada supinada recruta mais o bíceps comparado à puxada pronada."
  },
  "remada baixa": {
    description: "Sente-se na máquina de cabo baixo com os pés apoiados. Segure o triângulo ou barra com os braços estendidos. Puxe em direção ao abdome retraindo as escápulas, depois estenda controlando.",
    notes: "Mantenha o tronco ereto — não balance para trás para ajudar no movimento."
  },
  // Ombros
  "desenvolvimento": {
    description: "Sente-se num banco com encosto. Segure os halteres na altura dos ombros com palmas para frente. Empurre os halteres para cima até os braços ficarem quase estendidos, depois desça controlando.",
    notes: "Não trave os cotovelos no topo. Mantenha o core contraído para proteger a lombar."
  },
  "desenvolvimento com barra": {
    description: "Sente-se num banco com encosto. Segure a barra na altura dos ombros com pegada pronada. Empurre a barra para cima até os braços ficarem quase estendidos, depois desça controlando.",
    notes: "Pode ser feito em pé ou sentado. Em pé exige mais estabilidade do core."
  },
  "desenvolvimento militar": {
    description: "Em pé ou sentado, segure a barra na altura dos ombros com pegada pronada. Empurre a barra para cima até os braços ficarem quase estendidos, depois desça até a altura dos ombros.",
    notes: "Mantenha o core contraído e evite arquear demais a lombar."
  },
  "elevação lateral": {
    description: "Em pé com halteres nas mãos ao lado do corpo. Eleve os braços lateralmente até a altura dos ombros com os cotovelos levemente flexionados. Desça controlando. Foca no deltoide médio.",
    notes: "Não balance o tronco para ajudar — use um peso que permita controle total."
  },
  "elevação frontal": {
    description: "Em pé com halteres nas mãos à frente do corpo. Eleve um braço de cada vez (ou os dois) até a altura dos ombros. Desça controlando. Foca no deltoide anterior.",
    notes: "Mantenha os cotovelos levemente flexionados durante o movimento."
  },
  "encolhimento": {
    description: "Em pé com halteres ou barra nas mãos. Eleve os ombros em direção às orelhas contraindo o trapézio, segure por 1 segundo no topo, depois desça controlando.",
    notes: "Não gire os ombros — o movimento é apenas para cima e para baixo."
  },
  // Bíceps
  "rosca direta": {
    description: "Em pé com halteres ou barra nas mãos, palmas para cima. Flexione os cotovelos trazendo os halteres em direção aos ombros contraindo o bíceps. Desça controlando sem balançar o tronco.",
    notes: "Mantenha os cotovelos fixos ao lado do corpo — não deixe eles saírem para frente."
  },
  "rosca alternada": {
    description: "Em pé com halteres nas mãos. Flexione um braço de cada vez trazendo o halter em direção ao ombro, girando levemente o punho (supinação). Alterne os braços.",
    notes: "A supinação do punho aumenta o recrutamento do bíceps. Controle a descida."
  },
  "rosca martelo": {
    description: "Em pé com halteres nas mãos em posição neutra (palmas voltadas para o corpo). Flexione os cotovelos trazendo os halteres em direção aos ombros sem girar o punho.",
    notes: "Trabalha o braquial e braquiorradial além do bíceps. Ótimo para espessura do braço."
  },
  "rosca scott": {
    description: "Apoie os tríceps no suporte inclinado da máquina Scott. Segure a barra ou halteres com pegada supinada. Flexione os cotovelos trazendo o peso em direção ao rosto, depois desça controlando.",
    notes: "Isola completamente o bíceps pois elimina o balanço do tronco."
  },
  "rosca concentrada": {
    description: "Sentado, apoie o cotovelo na parte interna da coxa. Segure o halter e flexione o cotovelo trazendo o peso em direção ao ombro. Desça controlando. Alterne os braços.",
    notes: "Isola o bíceps. Mantenha o cotovelo fixo na coxa durante todo o movimento."
  },
  // Tríceps
  "tríceps pulley": {
    description: "Em pé de frente para o cabo alto. Segure a corda ou barra com pegada pronada. Mantenha os cotovelos fixos ao lado do corpo. Estenda os braços para baixo contraindo o tríceps, depois suba controlando.",
    notes: "Não mova os cotovelos — eles devem ficar fixos durante todo o movimento."
  },
  "tríceps corda": {
    description: "Em pé de frente para o cabo alto. Segure a corda com as duas mãos. Mantenha os cotovelos fixos ao lado do corpo. Estenda os braços para baixo abrindo a corda no final para maior contração do tríceps.",
    notes: "Abrir a corda no final do movimento aumenta o isolamento da cabeça lateral do tríceps."
  },
  "tríceps francês": {
    description: "Deitado no banco com halteres ou barra. Segure o peso acima da cabeça com os braços estendidos. Flexione os cotovelos abaixando o peso em direção à testa, depois estenda de volta.",
    notes: "Mantenha os cotovelos apontando para o teto — não deixe eles abrirem para os lados."
  },
  "mergulho": {
    description: "Apoie as mãos em duas barras paralelas ou numa cadeira. Dobre os cotovelos descendo o corpo até os braços ficarem em 90°, depois empurre de volta. Foca no tríceps e peitoral inferior.",
    notes: "Incline o tronco para frente para focar mais no peitoral, ou mantenha reto para focar no tríceps."
  },
  "tríceps testa": {
    description: "Deitado no banco com barra ou halteres. Segure o peso acima da testa com os braços estendidos. Flexione os cotovelos abaixando o peso em direção à testa, depois estenda de volta.",
    notes: "Mantenha os cotovelos apontando para o teto — não deixe eles abrirem para os lados."
  },
  // Pernas
  "agachamento": {
    description: "Em pé com os pés na largura dos ombros ou um pouco mais afastados. Desça dobrando os joelhos e quadril como se fosse sentar numa cadeira, mantendo o tronco ereto e os joelhos alinhados com os pés. Desça até as coxas ficarem paralelas ao chão, depois suba.",
    notes: "Mantenha os calcanhares no chão e o peito para cima. Os joelhos não devem passar muito além dos pés."
  },
  "agachamento livre": {
    description: "Em pé com os pés na largura dos ombros ou um pouco mais afastados. Desça dobrando os joelhos e quadril como se fosse sentar numa cadeira, mantendo o tronco ereto e os joelhos alinhados com os pés. Desça até as coxas ficarem paralelas ao chão, depois suba.",
    notes: "Mantenha os calcanhares no chão e o peito para cima. Os joelhos não devem passar muito além dos pés."
  },
  "leg press": {
    description: "Sente-se na máquina com os pés na plataforma na largura dos ombros. Desça a plataforma dobrando os joelhos até 90°, depois empurre de volta sem travar os joelhos no topo.",
    notes: "Não deixe os joelhos colapsarem para dentro. Posição dos pés mais alta foca nos glúteos, mais baixa nos quadríceps."
  },
  "cadeira extensora": {
    description: "Sente-se na máquina com os tornozelos sob o apoio. Estenda as pernas levantando o peso até os joelhos ficarem quase retos, depois desça controlando. Foca no quadríceps.",
    notes: "Não trave os joelhos no topo. Controle bem a descida para maior ativação muscular."
  },
  "mesa flexora": {
    description: "Deite de bruços na máquina com os calcanhares sob o apoio. Flexione os joelhos trazendo os calcanhares em direção aos glúteos, depois desça controlando. Foca nos isquiotibiais.",
    notes: "Mantenha os quadris apoiados na máquina durante todo o movimento."
  },
  "stiff": {
    description: "Em pé com halteres ou barra na frente do corpo. Incline o tronco para frente mantendo as pernas levemente flexionadas e a coluna neutra. Desça o peso ao longo das pernas sentindo o alongamento nos isquiotibiais, depois suba.",
    notes: "Não arredonde a coluna. O movimento vem do quadril, não da lombar."
  },
  "afundo": {
    description: "Em pé com os pés juntos. Dê um passo à frente e desça o joelho traseiro em direção ao chão, mantendo o tronco ereto. O joelho da frente deve ficar alinhado com o pé. Suba e alterne as pernas.",
    notes: "Também chamado de 'lunge'. Mantenha o tronco ereto e o core contraído."
  },
  "levantamento terra": {
    description: "Em pé com a barra no chão na frente dos pés. Agache segurando a barra com pegada pronada ou mista. Mantenha a coluna neutra, peito para cima. Suba estendendo quadril e joelhos simultaneamente até ficar em pé. Desça controlando.",
    notes: "Um dos exercícios mais completos. Mantenha a barra próxima ao corpo durante todo o movimento."
  },
  "panturrilha": {
    description: "Em pé com os dedos dos pés num degrau ou no chão. Suba nas pontas dos pés contraindo as panturrilhas, segure 1 segundo no topo, depois desça até sentir o alongamento.",
    notes: "Pode ser feito com peso adicional. Varie a posição dos pés para trabalhar diferentes partes."
  },
  "elevação de panturrilha": {
    description: "Em pé com os dedos dos pés num degrau ou no chão. Suba nas pontas dos pés contraindo as panturrilhas, segure 1 segundo no topo, depois desça até sentir o alongamento.",
    notes: "Pode ser feito com peso adicional. Varie a posição dos pés para trabalhar diferentes partes."
  },
  "hack squat": {
    description: "Posicione-se na máquina com os ombros sob os apoios e os pés na plataforma. Desça dobrando os joelhos até 90°, depois empurre de volta sem travar os joelhos no topo.",
    notes: "Foca nos quadríceps. Posição dos pés mais baixa aumenta a ativação dos quadríceps."
  },
  // Abdome
  "abdominal": {
    description: "Deite de costas com os joelhos dobrados e pés no chão. Coloque as mãos atrás da cabeça ou cruzadas no peito. Eleve o tronco em direção aos joelhos contraindo o abdome, depois desça controlando.",
    notes: "Não puxe o pescoço com as mãos. O movimento deve vir da contração do abdome."
  },
  "prancha": {
    description: "Apoie os antebraços e as pontas dos pés no chão. Mantenha o corpo reto como uma tábua, contraindo o abdome e glúteos. Respire normalmente e segure a posição pelo tempo determinado.",
    notes: "Não deixe o quadril subir nem cair. Olhe para o chão para manter a coluna neutra."
  },
  "abdominal infra": {
    description: "Deite de costas com as mãos ao lado do corpo ou sob os glúteos. Eleve as pernas estendidas até 90° ou dobre os joelhos trazendo-os em direção ao peito, depois desça controlando.",
    notes: "Foca na porção inferior do reto abdominal. Não use impulso — controle o movimento."
  },
  "oblíquo": {
    description: "Deite de costas com os joelhos dobrados. Coloque as mãos atrás da cabeça. Eleve o tronco girando em direção ao joelho oposto (cotovelo direito ao joelho esquerdo e vice-versa).",
    notes: "Foca nos oblíquos. Não puxe o pescoço — o movimento deve vir da rotação do tronco."
  },
  // Calistenia
  "burpee": {
    description: "Em pé, agache e apoie as mãos no chão. Jogue os pés para trás ficando em posição de flexão. Faça uma flexão (opcional). Traga os pés de volta, levante e salte com os braços para cima.",
    notes: "Exercício de alta intensidade que trabalha o corpo todo. Ajuste o ritmo conforme seu condicionamento."
  },
  "polichinelo": {
    description: "Em pé com os pés juntos e braços ao lado do corpo. Salte abrindo as pernas e levantando os braços acima da cabeça simultaneamente. Salte novamente voltando à posição inicial.",
    notes: "Ótimo para aquecimento e cardio. Mantenha um ritmo constante."
  },
  "mountain climber": {
    description: "Em posição de flexão com os braços estendidos. Traga um joelho em direção ao peito, depois alterne rapidamente com o outro joelho, como se estivesse correndo no lugar.",
    notes: "Mantenha o quadril nivelado e o core contraído durante todo o movimento."
  },
  "agachamento com salto": {
    description: "Faça um agachamento normal e ao subir, impulsione-se para cima saltando. Aterrisse suavemente com os joelhos levemente flexionados e vá direto para o próximo agachamento.",
    notes: "Exercício pliométrico de alta intensidade. Aterrisse suavemente para proteger os joelhos."
  },
  "dip": {
    description: "Apoie as mãos em duas barras paralelas ou numa cadeira. Dobre os cotovelos descendo o corpo até os braços ficarem em 90°, depois empurre de volta. Foca no tríceps e peitoral inferior.",
    notes: "Incline o tronco para frente para focar mais no peitoral, ou mantenha reto para focar no tríceps."
  },
};

function getExerciseDescription(name: string): { description: string; notes?: string } | undefined {
  const normalized = name.toLowerCase()
    .replace(/[\d.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  
  // Busca exata
  if (EXERCISE_DESCRIPTIONS[normalized]) return EXERCISE_DESCRIPTIONS[normalized];
  
  // Busca parcial — verifica se alguma chave está contida no nome ou vice-versa
  for (const [key, value] of Object.entries(EXERCISE_DESCRIPTIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  return undefined;
}

// ─── Parser de markdown para exercícios ──────────────────────────────────────

interface AIExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number; // segundos
  notes?: string;
  description?: string; // como executar o exercício
}

interface WorkoutDay {
  label: string;  // ex: "Dia A", "Segunda-feira", "Treino 1"
  exercises: AIExercise[];
}

interface ParsedWorkout {
  title: string;
  exercises: AIExercise[]; // lista plana (fallback / sem dias)
  days?: WorkoutDay[];    // agrupado por dias (quando detectado)
}

// Detecta blocos de dias no markdown e agrupa exercícios por dia
function parseDaysFromMarkdown(markdown: string, allExercises: AIExercise[]): WorkoutDay[] {
  const days: WorkoutDay[] = [];
  // Padrão ampliado: ## Dia A, ## Sessão A, ## Treino 1, **Sessão A:**, etc.
  const DAY_KEYWORDS = "Sess[aã]o|Dia|Treino|Bloco|Semana|Segunda|Ter[cç][aã]|Quarta|Quinta|Sexta|S[áa]bado|Domingo|Fase|Etapa";
  const headerRegex = new RegExp(`^#{1,4}\\s*((?:${DAY_KEYWORDS})[^\\n]*)`, "gim");
  const boldRegex = new RegExp(`^\\*{1,2}((?:${DAY_KEYWORDS})[^*\\n]*)\\*{1,2}[:\\s]*([^\\n]*)`, "gim");
  const dayMatches: { label: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRegex.exec(markdown)) !== null) {
    const label = m[1].replace(/[*_#:]/g, "").trim();
    if (!label || label.length < 3) continue;
    if (/^(programa|plano|treino de)/i.test(label) && dayMatches.length === 0) continue;
    dayMatches.push({ label, index: m.index });
  }
  // Fallback: negrito no início de linha
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

  // Para cada bloco de dia, encontrar quais exercícios pertencem a ele
  // baseado na posição do nome do exercício no markdown
  for (let i = 0; i < dayMatches.length; i++) {
    const start = dayMatches[i].index;
    const end = i + 1 < dayMatches.length ? dayMatches[i + 1].index : markdown.length;
    const block = markdown.slice(start, end);
    const dayExercises = allExercises.filter(ex => {
      const nameInBlock = block.toLowerCase().includes(ex.name.toLowerCase());
      return nameInBlock;
    });
    if (dayExercises.length > 0) {
      days.push({ label: dayMatches[i].label, exercises: dayExercises });
    }
  }
  return days;
}

function parseWorkoutMarkdown(markdown: string): ParsedWorkout {
  const lines = markdown.split("\n").map(l => l.trim());
  const exercises: AIExercise[] = [];
  let title = "Treino";

  // Extrair título
  const titleLine = lines.find(l => l.startsWith("# "));
  if (titleLine) title = titleLine.replace(/^#\s+/, "").replace(/[*_]/g, "").trim();

  // Estratégia 1: blocos de exercício com nome em linha separada seguido de séries
  // Detecta padrões como:
  //   ### 1. Agachamento Livre
  //   **Séries:** 4 | **Reps:** 8-12 | **Descanso:** 90s
  //   **Execução:** ...
  // ou:
  //   - **Flexão de Braço** — 3x12, descanso 60s
  //   *Como fazer: ...*

  const rawText = markdown;
  
  // Regex para capturar blocos de exercício no formato estruturado
  // Padrão 1: ### N. Nome do Exercício (cabeçalho de nível 2 ou 3)
  const headerBlockRegex = /#{2,4}\s*(?:\d+\.?\s*)?([^\n#]+)\n([\s\S]*?)(?=#{2,4}|$)/g;
  let headerMatch;
  const headerExercises: AIExercise[] = [];
  
  while ((headerMatch = headerBlockRegex.exec(rawText)) !== null) {
    const blockName = headerMatch[1].replace(/[*_`]/g, "").trim();
    const blockContent = headerMatch[2];
    
    // Ignorar seções que não são exercícios (aquecimento, cardio, etc. como títulos de seção)
    if (/^(treino|programa|semana|ciclo|dia|bloco|fase|cardio|nutrição|dica|observ|recom|progres)/i.test(blockName)) continue;
    if (blockName.length > 60) continue; // nome muito longo provavelmente não é exercício
    
    // Buscar séries x reps no bloco
    // Padrão 1: **Séries:** N | **Reps:** N (formato estruturado do prompt)
    const boldSetsRepsMatch = blockContent.match(/\*\*S.ries:\*\*\s*(\d+)[^\n]*\*\*Reps:\*\*\s*([\d\-–]+)/i);
    // Padrão 2: NxN
    const inlineMatch = blockContent.match(/(\d+)\s*[xX×]\s*([\d\-–]+)/i);
    // Padrão 3: S.ries: N ... Reps: N (sem bold)
    const plainMatch = blockContent.match(/S.ries?[*:\s]+(\d+)[^\n]*Reps?[*:\s]+([\d\-–]+)/i);
    
    const setsRepsMatch = boldSetsRepsMatch || inlineMatch || plainMatch;
    if (!setsRepsMatch) continue;
    
    const sets = parseInt(setsRepsMatch[1]) || 3;
    const reps = setsRepsMatch[2].replace(/\s*(reps?|repetições?)/i, "").trim();
    
    // Buscar tempo de descanso
    // Padrão: **Descanso:** 60s ou descanso 60s ou descanso: 2min
    const restMatch = blockContent.match(/Descanso[^0-9]*(\d+)\s*(s|seg|min|minuto)/i);
    let rest = 90;
    if (restMatch) {
      rest = restMatch[2].toLowerCase().startsWith("min")
        ? parseInt(restMatch[1]) * 60
        : parseInt(restMatch[1]);
    }
    
    // Buscar descrição de execução
    // Padrão: **Execução:** texto (bold) ou Execução: texto (plain)
    const descMatch = blockContent.match(/Execu..o:\*{0,2}\s*([^\n]+)/i)
      || blockContent.match(/Como fazer:\*{0,2}\s*([^\n]+)/i)
      || blockContent.match(/T.cnica:\*{0,2}\s*([^\n]+)/i);
    const description = descMatch ? descMatch[1].replace(/[*_]/g, "").trim() : undefined;
    
    // Buscar notas/dicas
    const notesMatch = blockContent.match(/Dica:\*{0,2}\s*([^\n]+)/i)
      || blockContent.match(/Observa..o:\*{0,2}\s*([^\n]+)/i);
    const notes = notesMatch ? notesMatch[1].replace(/[*_]/g, "").trim() : undefined;
    
    const fallbackDesc = !description ? getExerciseDescription(blockName) : undefined;
    headerExercises.push({
      name: blockName, sets, reps, rest,
      description: description ?? fallbackDesc?.description,
      notes: notes ?? fallbackDesc?.notes,
    });
  }
  
  if (headerExercises.length >= 3) {
    const days = parseDaysFromMarkdown(rawText, headerExercises);
    return { title, exercises: headerExercises, days: days.length >= 2 ? days : undefined };
  }
  
  // Estratégia 2: linha única com padrão "- **Nome**: 3x12"
  const lineExercises: AIExercise[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Padrão: bullet com nome em negrito seguido de séries
    const exerciseMatch = line.match(/^[-*•]?\s*\*{1,2}([^*:]{3,40})\*{0,2}[:\s—–-]+(?:[^\d]*(\d+)\s*[xX×]\s*([\d\-–]+))/i)
      || line.match(/^(?:\d+\.\s+)\*{1,2}([^*:]{3,40})\*{0,2}[:\s—–-]+(?:[^\d]*(\d+)\s*[xX×]\s*([\d\-–]+))/i)
      || line.match(/^[-*•]?\s*([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÈÌÒÙÇ][a-záéíóúâêîôûãõàèìòùç\s]{3,35})[:\s—–-]+(\d+)\s*[xX×]\s*([\d\-–]+)/i);
    
    if (exerciseMatch) {
      const name = exerciseMatch[1].replace(/[*_]/g, "").trim();
      const sets = parseInt(exerciseMatch[2]) || 3;
      const reps = exerciseMatch[3].trim();
      
      const restMatch = line.match(/descanso[:\s]+(\d+)\s*(s|seg|min|minuto)/i);
      let rest = 90;
      if (restMatch) {
        rest = restMatch[2].toLowerCase().startsWith("min")
          ? parseInt(restMatch[1]) * 60
          : parseInt(restMatch[1]);
      }
      
      // Verificar se a próxima linha tem descrição
      let description: string | undefined;
      let notes: string | undefined;
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j];
        if (!nextLine) break;
        if (/^[-*•#]/.test(nextLine) && !/^[*_]/.test(nextLine)) break;
        const descMatch = nextLine.match(/(?:[Ee]xecu[çc][ãa]o|[Cc]omo fazer|[Tt]écnica)[:\s]+(.+)/i)
          || nextLine.match(/^\*([^*]{20,})\*$/)
          || nextLine.match(/^_([^_]{20,})_$/);
        if (descMatch) { description = descMatch[1].replace(/[*_]/g, "").trim(); break; }
        const noteMatch = nextLine.match(/(?:[Oo]bserva[çc][ãa]o|[Dd]ica|[Nn]ota)[:\s]+(.+)/i);
        if (noteMatch) { notes = noteMatch[1].replace(/[*_]/g, "").trim(); break; }
      }
      
      const fallbackDescLine = !description ? getExerciseDescription(name) : undefined;
      lineExercises.push({
        name, sets, reps, rest,
        description: description ?? fallbackDescLine?.description,
        notes: notes ?? fallbackDescLine?.notes,
      });
    }
  }
  
  if (lineExercises.length >= 3) {
    return { title, exercises: lineExercises };
  }
  
  // Estratégia 3: qualquer linha com padrão NxN após um nome
  const fallbackExercises: AIExercise[] = [];
  for (const line of lines) {
    const m = line.match(/([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÈÌÒÙÇ][\wáéíóúâêîôûãõàèìòùç\s]{2,35})\s+(\d+)\s*[xX×]\s*([\d\-–]+)/i);
    if (m) {
      const name = m[1].replace(/[*_#-]/g, "").trim();
      if (name.length < 3 || /^(treino|programa|semana|ciclo|dia|bloco)/i.test(name)) continue;
      const sets = parseInt(m[2]) || 3;
      const reps = m[3].trim();
      const restMatch = line.match(/descanso[:\s]+(\d+)\s*(s|seg|min|minuto)/i);
      let rest = 90;
      if (restMatch) {
        rest = restMatch[2].toLowerCase().startsWith("min")
          ? parseInt(restMatch[1]) * 60
          : parseInt(restMatch[1]);
      }
      const fallbackDescFb = getExerciseDescription(name);
      fallbackExercises.push({ name, sets, reps, rest, description: fallbackDescFb?.description, notes: fallbackDescFb?.notes });
    }
  }
  
  if (fallbackExercises.length >= 2) {
    return { title, exercises: fallbackExercises };
  }

  // Último recurso: extrair qualquer nome de exercício conhecido
  const knownExercises = [
    "Agachamento", "Supino", "Remada", "Desenvolvimento", "Rosca", "Tríceps",
    "Leg Press", "Cadeira Extensora", "Mesa Flexora", "Elevação Lateral",
    "Puxada", "Barra Fixa", "Flexão", "Afundo", "Stiff", "Levantamento",
    "Crucifixo", "Voador", "Pulldown", "Serrote", "Prancha", "Abdominal",
    "Burpee", "Polichinelo", "Corrida", "Aquecimento", "Alongamento"
  ];
  const foundExercises: AIExercise[] = [];
  for (const line of lines) {
    for (const ex of knownExercises) {
      if (line.toLowerCase().includes(ex.toLowerCase())) {
        const setsMatch = line.match(/(\d+)\s*[xX×]\s*([\d\-–]+)/);
        if (setsMatch) {
          foundExercises.push({
            name: ex,
            sets: parseInt(setsMatch[1]) || 3,
            reps: setsMatch[2],
            rest: 90
          });
          break;
        }
      }
    }
  }
  
  if (foundExercises.length >= 2) {
    return { title, exercises: foundExercises };
  }

  // Fallback absoluto
  return {
    title,
    exercises: [
      { name: "Aquecimento", sets: 1, reps: "5-10min", rest: 30 },
      { name: "Exercício Principal 1", sets: 3, reps: "10-12", rest: 90 },
      { name: "Exercício Principal 2", sets: 3, reps: "10-12", rest: 90 },
      { name: "Exercício Auxiliar", sets: 3, reps: "12-15", rest: 60 },
      { name: "Alongamento", sets: 1, reps: "5-10min", rest: 30 },
    ]
  };
}

function getRestTimeFromSettings(defaultSeconds: number): number {
  const saved = localStorage.getItem("gym-rest-time-seconds");
  if (saved !== null) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed) && parsed >= 10) return parsed;
  }
  return defaultSeconds;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ExecutarTreinoIA() {
  const params = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const haptic = useHaptic();
  const workoutId = parseInt(params.id || "0");
  // Ler ?day= da URL para pular direto para um dia específico
  const urlDayIdx = (() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const match = search.match(/[?&]day=(\d+)/);
    return match ? parseInt(match[1]) : null;
  })();

  // Buscar treino salvo por id
  const { data: workout } = trpc.savedWorkouts.getById.useQuery(
    { id: workoutId },
    { enabled: workoutId > 0 }
  );

  // Estado do treino
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [setData, setSetData] = useState<Record<string, { reps: number; load: number }>>({});
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(urlDayIdx ?? 0);
  // Se veio com ?day=, pular direto para execução (sem tela de seleção)
  const [dayStarted, setDayStarted] = useState(urlDayIdx !== null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Solicitar permissão de notificação ao montar
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Timer de descanso
  useEffect(() => {
    if (isResting && restTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsResting(false);
            notifyRestEnd();
            haptic.restEnd();
            toast.success("Descanso terminado! Próxima série.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isResting, restTimeLeft]);

  const startRest = useCallback((seconds: number) => {
    const duration = getRestTimeFromSettings(seconds);
    setRestTimeLeft(duration);
    setIsResting(true);
    haptic.restStart();
  }, []);

  const skipRest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsResting(false);
    setRestTimeLeft(0);
  };

  const getSetKey = (exIdx: number, setNum: number) => `${exIdx}-${setNum}`;

  const getSetValues = (exIdx: number, setNum: number) => {
    const key = getSetKey(exIdx, setNum);
    return setData[key] || { reps: 10, load: 0 };
  };

  const updateSetValues = (exIdx: number, setNum: number, field: 'reps' | 'load', value: number) => {
    const key = getSetKey(exIdx, setNum);
    setSetData(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { reps: 10, load: 0 }), [field]: value }
    }));
  };

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando treino...</p>
        </div>
      </div>
    );
  }

  const parsed = parseWorkoutMarkdown(workout.content);
  // Se o treino tem dias, usar os exercícios do dia selecionado
  const activeDay = parsed.days ? parsed.days[selectedDayIdx] : undefined;
  const exercises = activeDay ? activeDay.exercises : parsed.exercises;
  const currentExercise = exercises[currentExIdx];
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const completedCount = completedSets.size;
  const progress = totalSets > 0 ? (completedCount / totalSets) * 100 : 0;

  const handleCompleteSet = () => {
    const key = getSetKey(currentExIdx, currentSet);
    const newCompleted = new Set(completedSets);
    newCompleted.add(key);
    setCompletedSets(newCompleted);
    haptic.setComplete();

    const isLastSet = currentSet >= currentExercise.sets;
    const isLastExercise = currentExIdx >= exercises.length - 1;

    if (isLastSet && isLastExercise) {
      haptic.workoutComplete();
      setFinished(true);
      toast.success("🎉 Treino concluído! Excelente trabalho!");
      return;
    }

    if (isLastSet) {
      setCurrentExIdx(prev => prev + 1);
      setCurrentSet(1);
      setShowDescription(false);
      haptic.success();
    } else {
      setCurrentSet(prev => prev + 1);
    }

    startRest(currentExercise.rest);
  };

  const handleSkipExercise = () => {
    skipRest();
    haptic.medium();
    if (currentExIdx < exercises.length - 1) {
      setCurrentExIdx(prev => prev + 1);
      setCurrentSet(1);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const userRestTime = localStorage.getItem("gym-rest-time-seconds");
  const isUserConfig = userRestTime !== null && !isNaN(parseInt(userRestTime, 10));
  const currentSetValues = getSetValues(currentExIdx, currentSet);

  // ─── Tela de seleção de dia (quando treino tem múltiplos dias) ────────────────────
  if (parsed.days && !dayStarted) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => navigate("/treinos-salvos")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-base font-bold truncate max-w-[200px]">{workout.title}</h1>
              <div className="w-16" />
            </div>
          </div>
        </header>
        <main className="container py-8 max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Escolha o Dia</h2>
            <p className="text-muted-foreground text-sm">Selecione qual dia do programa você vai treinar hoje</p>
          </div>
          <div className="space-y-3">
            {parsed.days.map((day, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDayIdx(idx);
                  setCurrentExIdx(0);
                  setCurrentSet(1);
                  setCompletedSets(new Set());
                  setSetData({});
                  setDayStarted(true);
                }}
                className="w-full text-left p-4 rounded-xl border-2 border-border bg-card transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-base">{day.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {day.exercises.length} exercícios · {day.exercises.reduce((s, e) => s + e.sets, 0)} séries
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {day.exercises.slice(0, 4).map((ex, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{ex.name}</Badge>
                      ))}
                      {day.exercises.length > 4 && (
                        <Badge variant="outline" className="text-xs">+{day.exercises.length - 4} mais</Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-3" />
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ─── Tela de conclusão ────────────────────────────────────────────────────────────────────────────
  if (finished) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Treino Concluído!</h1>
          <p className="text-muted-foreground mb-2">{workout.title}</p>
          <p className="text-sm text-muted-foreground mb-8">
            {exercises.length} exercícios · {totalSets} séries completadas
          </p>
          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={() => navigate("/treinos-salvos")}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Treinos Salvos
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              setCurrentExIdx(0);
              setCurrentSet(1);
              setCompletedSets(new Set());
              setSetData({});
              setFinished(false);
            }}>
              <Play className="w-5 h-5 mr-2" />
              Repetir Treino
            </Button>
            {parsed.days && (
              <Button variant="outline" className="w-full" onClick={() => {
                setCurrentExIdx(0);
                setCurrentSet(1);
                setCompletedSets(new Set());
                setSetData({});
                setFinished(false);
                setDayStarted(false);
              }}>
                <TrendingUp className="w-5 h-5 mr-2" />
                Treinar Outro Dia
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Tela de execução ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/treinos-salvos")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <div className="text-center">
              <h1 className="text-base font-bold truncate max-w-[180px]">{workout.title}</h1>
              <p className="text-xs text-muted-foreground">
                {activeDay ? `${activeDay.label} · ` : ""}
                Exercício {currentExIdx + 1} de {exercises.length}
              </p>
              {parsed.days && (
                <button
                  onClick={() => setDayStarted(false)}
                  className="text-xs text-primary hover:underline mt-0.5"
                >
                  Trocar dia
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExerciseList(!showExerciseList)}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          {/* Barra de progresso */}
          <div className="mt-3 w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Lista de exercícios (dropdown) */}
      {showExerciseList && (
        <div className="container py-3 border-b border-border bg-card/80">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Exercícios</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {exercises.map((ex, i) => {
              const done = Array.from({ length: ex.sets }, (_, s) =>
                completedSets.has(getSetKey(i, s + 1))
              ).every(Boolean);
              return (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentExIdx(i);
                    setCurrentSet(1);
                    skipRest();
                    setShowExerciseList(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                    i === currentExIdx
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {done ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="flex-1 truncate">{ex.name}</span>
                  <span className="text-xs text-muted-foreground">{ex.sets}×{ex.reps}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="container py-6 max-w-2xl">
        {/* Timer de Descanso */}
        {isResting && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="py-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-primary animate-pulse" />
              <h2 className="text-5xl font-bold mb-2 tabular-nums">{formatTime(restTimeLeft)}</h2>
              <p className="text-muted-foreground mb-2">Tempo de descanso</p>
              {isUserConfig ? (
                <p className="text-xs text-primary/70 mb-4 flex items-center justify-center gap-1">
                  <Settings className="w-3 h-3" />
                  Configuração pessoal ({userRestTime}s)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mb-4">Tempo do programa</p>
              )}
              <Button onClick={skipRest} variant="outline">
                <SkipForward className="w-4 h-4 mr-2" />
                Pular Descanso
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Exercício Atual */}
        {!isResting && (
          <>
            <ExerciseCard
              index={currentExIdx + 1}
              name={currentExercise.name}
              sets={currentExercise.sets}
              reps={currentExercise.reps}
              currentSet={currentSet}
              completedSetKeys={completedSets}
              getSetKey={getSetKey}
              description={currentExercise.description}
              notes={currentExercise.notes}
            />

            {/* Inputs de Repetições e Carga */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Registrar Série {currentSet}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Repetições</label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={currentSetValues.reps}
                      onChange={(e) => updateSetValues(currentExIdx, currentSet, 'reps', parseInt(e.target.value) || 0)}
                      className="text-lg font-semibold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Carga (kg)</label>
                    <div className="flex gap-1 items-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 text-xs"
                        onClick={() => updateSetValues(currentExIdx, currentSet, 'load', Math.max(0, currentSetValues.load - 2.5))}
                      >
                        -2.5
                      </Button>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        value={currentSetValues.load}
                        onChange={(e) => updateSetValues(currentExIdx, currentSet, 'load', parseFloat(e.target.value) || 0)}
                        className="text-lg font-semibold text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 text-xs"
                        onClick={() => updateSetValues(currentExIdx, currentSet, 'load', currentSetValues.load + 2.5)}
                      >
                        +2.5
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Sugestão:</strong> {currentExercise.reps} repetições
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Descanso:{" "}
                    {isUserConfig ? (
                      <span className="text-primary font-medium">{userRestTime}s (pessoal)</span>
                    ) : (
                      <span>{currentExercise.rest}s (programa)</span>
                    )}
                  </p>
                </div>


              </CardContent>
            </Card>

            {/* Botões de ação */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full h-14 text-base"
                onClick={handleCompleteSet}
              >
                <Check className="w-5 h-5 mr-2" />
                Completar Série {currentSet}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkipExercise}
                  disabled={currentExIdx >= exercises.length - 1}
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Pular Exercício
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Encerrar o treino agora?")) {
                      setFinished(true);
                    }
                  }}
                >
                  Encerrar Treino
                </Button>
              </div>
            </div>

            {/* Próximo exercício */}
            {currentExIdx < exercises.length - 1 && (
              <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg flex items-center gap-3">
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Próximo exercício</p>
                  <p className="text-sm font-medium">{exercises[currentExIdx + 1].name}</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
