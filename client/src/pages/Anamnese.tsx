import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  ClipboardList, 
  User, 
  Target, 
  Activity, 
  AlertCircle,
  Calendar,
  Utensils,
  Ruler,
  FileText,
  Edit
} from "lucide-react";
import { Link } from "wouter";

export default function Anamnese() {
  const { data: anamnese, isLoading } = trpc.anamnese.getMy.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ClipboardList className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando anamnese...</p>
        </div>
      </div>
    );
  }

  if (!anamnese) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma anamnese encontrada</h3>
              <p className="text-muted-foreground mb-6">
                Preencha sua anamnese para receber um treino personalizado
              </p>
              <Button asChild>
                <Link href="/anamnese/preencher">
                  <FileText className="w-4 h-4 mr-2" />
                  Preencher Anamnese
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Minha Anamnese</h1>
              <p className="text-sm text-muted-foreground">
                Informações completas para treino personalizado
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/anamnese/editar">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {anamnese.age && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Idade</p>
                    <p className="font-medium">{anamnese.age} anos</p>
                  </div>
                )}
                {anamnese.gender && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Gênero</p>
                    <p className="font-medium">{anamnese.gender}</p>
                  </div>
                )}
                {anamnese.height && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Altura</p>
                    <p className="font-medium">{anamnese.height} cm</p>
                  </div>
                )}
                {anamnese.currentWeight && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Peso Atual</p>
                    <p className="font-medium">{anamnese.currentWeight} kg</p>
                  </div>
                )}
                {anamnese.targetWeight && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Peso Alvo</p>
                    <p className="font-medium">{anamnese.targetWeight} kg</p>
                  </div>
                )}
                {anamnese.bodyFat && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">% Gordura</p>
                    <p className="font-medium">{anamnese.bodyFat}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Objetivos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {anamnese.primaryGoal && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Objetivo Principal</p>
                  <Badge variant="default" className="text-sm">
                    {anamnese.primaryGoal}
                  </Badge>
                </div>
              )}
              {anamnese.secondaryGoals && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Objetivos Secundários</p>
                  <p className="font-medium">{anamnese.secondaryGoals}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Treino */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Histórico de Treino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {anamnese.trainingExperience && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Experiência</p>
                  <p className="font-medium">{anamnese.trainingExperience}</p>
                </div>
              )}
              {anamnese.currentTrainingFrequency && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Frequência Atual</p>
                  <p className="font-medium">{anamnese.currentTrainingFrequency}</p>
                </div>
              )}
              {anamnese.previousInjuries && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lesões Anteriores</p>
                  <p className="font-medium">{anamnese.previousInjuries}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Restrições */}
          {(anamnese.medicalRestrictions || anamnese.exerciseRestrictions) && (
            <Card className="border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Restrições e Limitações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {anamnese.medicalRestrictions && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Restrições Médicas</p>
                    <p className="font-medium">{anamnese.medicalRestrictions}</p>
                  </div>
                )}
                {anamnese.exerciseRestrictions && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Restrições de Exercícios</p>
                    <p className="font-medium">{anamnese.exerciseRestrictions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Disponibilidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Disponibilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {anamnese.availableDays && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Dias Disponíveis</p>
                    <p className="font-medium">{anamnese.availableDays}</p>
                  </div>
                )}
                {anamnese.sessionDuration && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Duração da Sessão</p>
                    <p className="font-medium">{anamnese.sessionDuration}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estilo de Vida */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Estilo de Vida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {anamnese.occupation && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ocupação</p>
                    <p className="font-medium">{anamnese.occupation}</p>
                  </div>
                )}
                {anamnese.activityLevel && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nível de Atividade</p>
                    <p className="font-medium">{anamnese.activityLevel}</p>
                  </div>
                )}
                {anamnese.sleepHours && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Horas de Sono</p>
                    <p className="font-medium">{anamnese.sleepHours}</p>
                  </div>
                )}
                {anamnese.stressLevel && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nível de Estresse</p>
                    <p className="font-medium">{anamnese.stressLevel}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Nutrição */}
          {(anamnese.dietType || anamnese.supplementation) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  Nutrição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {anamnese.dietType && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tipo de Dieta</p>
                      <p className="font-medium">{anamnese.dietType}</p>
                    </div>
                  )}
                  {anamnese.supplementation && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Suplementação</p>
                      <p className="font-medium">{anamnese.supplementation}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medidas Corporais */}
          {(anamnese.chest || anamnese.waist || anamnese.hips || anamnese.thigh || anamnese.arm) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-primary" />
                  Medidas Corporais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {anamnese.chest && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Peitoral</p>
                      <p className="font-medium">{anamnese.chest} cm</p>
                    </div>
                  )}
                  {anamnese.waist && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Cintura</p>
                      <p className="font-medium">{anamnese.waist} cm</p>
                    </div>
                  )}
                  {anamnese.hips && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Quadril</p>
                      <p className="font-medium">{anamnese.hips} cm</p>
                    </div>
                  )}
                  {anamnese.thigh && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Coxa</p>
                      <p className="font-medium">{anamnese.thigh} cm</p>
                    </div>
                  )}
                  {anamnese.arm && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Braço</p>
                      <p className="font-medium">{anamnese.arm} cm</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações Adicionais */}
          {anamnese.additionalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Observações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium whitespace-pre-wrap">{anamnese.additionalNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
