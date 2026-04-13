/**
 * ExerciseCard — componente reutilizável de card de exercício durante execução de treino.
 * Usado em ExecutarTreino, ExecutarTreinoIA e ExecutarCalistenia.
 */
import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Info, ChevronDown, ChevronUp } from "lucide-react";

// ─── Banco de descrições de exercícios (fallback) ────────────────────────────

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

export function getExerciseDescriptionByName(name: string): { description: string; notes?: string } | undefined {
  const normalized = name.toLowerCase()
    .replace(/[\d.]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (EXERCISE_DESCRIPTIONS[normalized]) return EXERCISE_DESCRIPTIONS[normalized];

  for (const [key, value] of Object.entries(EXERCISE_DESCRIPTIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return undefined;
}

// ─── Props do componente ──────────────────────────────────────────────────────

interface ExerciseCardProps {
  /** Número do exercício na lista (1-based) */
  index: number;
  /** Nome do exercício */
  name: string;
  /** Total de séries */
  sets: number;
  /** Reps como string, ex: "10-12" ou "8" */
  reps: string;
  /** Série atual (1-based) */
  currentSet: number;
  /** Conjunto de chaves de séries concluídas, ex: Set<"0-1"> */
  completedSetKeys: Set<string>;
  /** Função para gerar a chave de uma série, ex: (exIdx, setNum) => "0-1" */
  getSetKey: (exIdx: number, setNum: number) => string;
  /** Descrição de execução (opcional — usa fallback do banco se não fornecida) */
  description?: string;
  /** Dica técnica (opcional) */
  notes?: string;
  /** Técnica especial, ex: "Drop set" */
  technique?: string;
}

export default function ExerciseCard({
  index,
  name,
  sets,
  reps,
  currentSet,
  completedSetKeys,
  getSetKey,
  description,
  notes,
  technique,
}: ExerciseCardProps) {
  const [showDescription, setShowDescription] = useState(false);

  // Usar descrição fornecida ou buscar no banco de fallback
  const fallback = !description ? getExerciseDescriptionByName(name) : undefined;
  const resolvedDescription = description ?? fallback?.description;
  const resolvedNotes = notes ?? fallback?.notes;

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{index}</span>
              </div>
              <CardTitle className="text-xl">{name}</CardTitle>
            </div>
            <div className="flex items-center gap-2 ml-10 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {sets} séries × {reps}
              </Badge>
              {technique && (
                <Badge variant="outline" className="text-xs">
                  {technique}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Série {currentSet} de {sets}
              </span>
            </div>
          </div>
        </div>

        {/* Indicador visual de séries */}
        <div className="flex gap-2 mt-3 ml-10 flex-wrap">
          {Array.from({ length: sets }, (_, i) => {
            const setNum = i + 1;
            const isDone = completedSetKeys.has(getSetKey(index - 1, setNum));
            const isCurrent = setNum === currentSet;
            return (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isDone
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : setNum}
              </div>
            );
          })}
        </div>

        {/* Botão Como Fazer */}
        <button
          onClick={() => setShowDescription(prev => !prev)}
          className="mt-3 ml-10 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          Como fazer este exercício
          {showDescription ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Descrição de execução */}
        {showDescription && (
          <div className="mt-2 ml-10 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            {resolvedDescription ? (
              <p className="text-sm text-foreground leading-relaxed">{resolvedDescription}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Descrição não disponível para este exercício. Consulte um profissional para aprender a execução correta.
              </p>
            )}
            {resolvedNotes && (
              <p className="text-xs text-primary mt-2 pt-2 border-t border-primary/20">
                <strong>Dica:</strong> {resolvedNotes}
              </p>
            )}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
