import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ClipboardList, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AnamneseForm() {
  const [, setLocation] = useLocation();
  const { data: existing } = trpc.anamnese.getMy.useQuery();
  const isEdit = !!existing;

  const createMutation = trpc.anamnese.create.useMutation({
    onSuccess: () => {
      toast.success("Anamnese salva com sucesso!");
      setLocation("/anamnese");
    },
    onError: (error) => {
      toast.error(`Erro ao salvar anamnese: ${error.message}`);
    },
  });

  const updateMutation = trpc.anamnese.update.useMutation({
    onSuccess: () => {
      toast.success("Anamnese atualizada com sucesso!");
      setLocation("/anamnese");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar anamnese: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    age: "",
    height: "",
    currentWeight: "",
    targetWeight: "",
    gender: "",
    primaryGoal: "",
    secondaryGoals: "",
    trainingExperience: "",
    currentTrainingFrequency: "",
    previousInjuries: "",
    medicalRestrictions: "",
    exerciseRestrictions: "",
    availableDays: "",
    sessionDuration: "",
    occupation: "",
    activityLevel: "",
    sleepHours: "",
    stressLevel: "",
    dietType: "",
    supplementation: "",
    chest: "",
    waist: "",
    hips: "",
    thigh: "",
    arm: "",
    bodyFat: "",
    additionalNotes: "",
  });

  // Pré-popular campos ao editar
  useEffect(() => {
    if (!existing) return;
    setFormData({
      age: existing.age?.toString() ?? "",
      height: existing.height ?? "",
      currentWeight: existing.currentWeight ?? "",
      targetWeight: existing.targetWeight ?? "",
      gender: existing.gender ?? "",
      primaryGoal: existing.primaryGoal ?? "",
      secondaryGoals: existing.secondaryGoals ?? "",
      trainingExperience: existing.trainingExperience ?? "",
      currentTrainingFrequency: existing.currentTrainingFrequency ?? "",
      previousInjuries: existing.previousInjuries ?? "",
      medicalRestrictions: existing.medicalRestrictions ?? "",
      exerciseRestrictions: existing.exerciseRestrictions ?? "",
      availableDays: existing.availableDays ?? "",
      sessionDuration: existing.sessionDuration ?? "",
      occupation: existing.occupation ?? "",
      activityLevel: existing.activityLevel ?? "",
      sleepHours: existing.sleepHours ?? "",
      stressLevel: existing.stressLevel ?? "",
      dietType: existing.dietType ?? "",
      supplementation: existing.supplementation ?? "",
      chest: existing.chest ?? "",
      waist: existing.waist ?? "",
      hips: existing.hips ?? "",
      thigh: existing.thigh ?? "",
      arm: existing.arm ?? "",
      bodyFat: existing.bodyFat ?? "",
      additionalNotes: existing.additionalNotes ?? "",
    });
  }, [existing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      age: formData.age ? parseInt(formData.age) : undefined,
    };

    if (isEdit) {
      updateMutation.mutate(dataToSubmit);
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ClipboardList className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? "Editar Anamnese" : "Preencher Anamnese"}</h1>
            <p className="text-sm text-muted-foreground">
              {isEdit ? "Atualize suas informações para personalizar treino e dieta" : "Complete suas informações para receber um treino personalizado"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Informações básicas sobre você</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="age">Idade *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="gender">Gênero *</Label>
                <Select value={formData.gender} onValueChange={(value) => updateField("gender", value)} required>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="height">Altura (cm) *</Label>
                <Input
                  id="height"
                  type="text"
                  placeholder="Ex: 175"
                  value={formData.height}
                  onChange={(e) => updateField("height", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="currentWeight">Peso Atual (kg) *</Label>
                <Input
                  id="currentWeight"
                  type="text"
                  placeholder="Ex: 83"
                  value={formData.currentWeight}
                  onChange={(e) => updateField("currentWeight", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="targetWeight">Peso Alvo (kg)</Label>
                <Input
                  id="targetWeight"
                  type="text"
                  placeholder="Ex: 90"
                  value={formData.targetWeight}
                  onChange={(e) => updateField("targetWeight", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bodyFat">% Gordura Corporal</Label>
                <Input
                  id="bodyFat"
                  type="text"
                  placeholder="Ex: 15"
                  value={formData.bodyFat}
                  onChange={(e) => updateField("bodyFat", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Objetivos */}
          <Card>
            <CardHeader>
              <CardTitle>Objetivos</CardTitle>
              <CardDescription>O que você deseja alcançar?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="primaryGoal">Objetivo Principal *</Label>
                <Select value={formData.primaryGoal} onValueChange={(value) => updateField("primaryGoal", value)} required>
                  <SelectTrigger id="primaryGoal">
                    <SelectValue placeholder="Selecione seu objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hipertrofia">Hipertrofia (Ganho de Massa Muscular)</SelectItem>
                    <SelectItem value="forca">Força</SelectItem>
                    <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                    <SelectItem value="definicao">Definição Muscular</SelectItem>
                    <SelectItem value="condicionamento">Condicionamento Físico</SelectItem>
                    <SelectItem value="saude">Saúde e Bem-estar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="secondaryGoals">Objetivos Secundários</Label>
                <Textarea
                  id="secondaryGoals"
                  placeholder="Ex: Melhorar postura, aumentar resistência..."
                  value={formData.secondaryGoals}
                  onChange={(e) => updateField("secondaryGoals", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Treino */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Treino</CardTitle>
              <CardDescription>Sua experiência com exercícios físicos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="trainingExperience">Experiência com Treino *</Label>
                <Select value={formData.trainingExperience} onValueChange={(value) => updateField("trainingExperience", value)} required>
                  <SelectTrigger id="trainingExperience">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante (0-6 meses)</SelectItem>
                    <SelectItem value="intermediario">Intermediário (6 meses - 2 anos)</SelectItem>
                    <SelectItem value="avancado">Avançado (2-5 anos)</SelectItem>
                    <SelectItem value="expert">Expert (5+ anos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currentTrainingFrequency">Frequência Atual de Treino</Label>
                <Select value={formData.currentTrainingFrequency} onValueChange={(value) => updateField("currentTrainingFrequency", value)}>
                  <SelectTrigger id="currentTrainingFrequency">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentario">Sedentário</SelectItem>
                    <SelectItem value="1-2x">1-2x por semana</SelectItem>
                    <SelectItem value="3-4x">3-4x por semana</SelectItem>
                    <SelectItem value="5-6x">5-6x por semana</SelectItem>
                    <SelectItem value="diario">Diário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="previousInjuries">Lesões Anteriores</Label>
                <Textarea
                  id="previousInjuries"
                  placeholder="Descreva lesões passadas ou atuais..."
                  value={formData.previousInjuries}
                  onChange={(e) => updateField("previousInjuries", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Restrições */}
          <Card className="border-yellow-500/30">
            <CardHeader>
              <CardTitle>Restrições e Limitações</CardTitle>
              <CardDescription>Importante para sua segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="medicalRestrictions">Restrições Médicas</Label>
                <Textarea
                  id="medicalRestrictions"
                  placeholder="Ex: Problemas cardíacos, diabetes, pressão alta..."
                  value={formData.medicalRestrictions}
                  onChange={(e) => updateField("medicalRestrictions", e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="exerciseRestrictions">Exercícios a Evitar</Label>
                <Textarea
                  id="exerciseRestrictions"
                  placeholder="Ex: Agachamento profundo, supino..."
                  value={formData.exerciseRestrictions}
                  onChange={(e) => updateField("exerciseRestrictions", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Disponibilidade */}
          <Card>
            <CardHeader>
              <CardTitle>Disponibilidade</CardTitle>
              <CardDescription>Quando você pode treinar?</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="availableDays">Dias Disponíveis *</Label>
                <Input
                  id="availableDays"
                  type="text"
                  placeholder="Ex: Segunda, Quarta, Sexta"
                  value={formData.availableDays}
                  onChange={(e) => updateField("availableDays", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sessionDuration">Duração da Sessão *</Label>
                <Select value={formData.sessionDuration} onValueChange={(value) => updateField("sessionDuration", value)} required>
                  <SelectTrigger id="sessionDuration">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30-45min">30-45 minutos</SelectItem>
                    <SelectItem value="45-60min">45-60 minutos</SelectItem>
                    <SelectItem value="60-90min">60-90 minutos</SelectItem>
                    <SelectItem value="90+min">Mais de 90 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Estilo de Vida */}
          <Card>
            <CardHeader>
              <CardTitle>Estilo de Vida</CardTitle>
              <CardDescription>Informações sobre sua rotina</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="occupation">Ocupação</Label>
                <Input
                  id="occupation"
                  type="text"
                  placeholder="Ex: Programador, Professor..."
                  value={formData.occupation}
                  onChange={(e) => updateField("occupation", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="activityLevel">Nível de Atividade Diária</Label>
                <Select value={formData.activityLevel} onValueChange={(value) => updateField("activityLevel", value)}>
                  <SelectTrigger id="activityLevel">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentario">Sedentário (trabalho sentado)</SelectItem>
                    <SelectItem value="leve">Leve (pouco movimento)</SelectItem>
                    <SelectItem value="moderado">Moderado (movimento regular)</SelectItem>
                    <SelectItem value="ativo">Ativo (muito movimento)</SelectItem>
                    <SelectItem value="muito-ativo">Muito Ativo (trabalho físico)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sleepHours">Horas de Sono por Noite</Label>
                <Select value={formData.sleepHours} onValueChange={(value) => updateField("sleepHours", value)}>
                  <SelectTrigger id="sleepHours">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="menos-5h">Menos de 5h</SelectItem>
                    <SelectItem value="5-6h">5-6 horas</SelectItem>
                    <SelectItem value="6-7h">6-7 horas</SelectItem>
                    <SelectItem value="7-8h">7-8 horas</SelectItem>
                    <SelectItem value="8+h">Mais de 8 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stressLevel">Nível de Estresse</Label>
                <Select value={formData.stressLevel} onValueChange={(value) => updateField("stressLevel", value)}>
                  <SelectTrigger id="stressLevel">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="muito-alto">Muito Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Nutrição */}
          <Card>
            <CardHeader>
              <CardTitle>Nutrição</CardTitle>
              <CardDescription>Informações sobre sua alimentação</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="dietType">Tipo de Dieta</Label>
                <Select value={formData.dietType} onValueChange={(value) => updateField("dietType", value)}>
                  <SelectTrigger id="dietType">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onivora">Onívora</SelectItem>
                    <SelectItem value="vegetariana">Vegetariana</SelectItem>
                    <SelectItem value="vegana">Vegana</SelectItem>
                    <SelectItem value="low-carb">Low Carb</SelectItem>
                    <SelectItem value="cetogenica">Cetogênica</SelectItem>
                    <SelectItem value="flexivel">Flexível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="supplementation">Suplementação</Label>
                <Input
                  id="supplementation"
                  type="text"
                  placeholder="Ex: Whey, Creatina..."
                  value={formData.supplementation}
                  onChange={(e) => updateField("supplementation", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medidas Corporais */}
          <Card>
            <CardHeader>
              <CardTitle>Medidas Corporais (Opcional)</CardTitle>
              <CardDescription>Para acompanhamento de evolução</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="chest">Peitoral (cm)</Label>
                <Input
                  id="chest"
                  type="text"
                  placeholder="Ex: 105"
                  value={formData.chest}
                  onChange={(e) => updateField("chest", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="waist">Cintura (cm)</Label>
                <Input
                  id="waist"
                  type="text"
                  placeholder="Ex: 85"
                  value={formData.waist}
                  onChange={(e) => updateField("waist", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="hips">Quadril (cm)</Label>
                <Input
                  id="hips"
                  type="text"
                  placeholder="Ex: 95"
                  value={formData.hips}
                  onChange={(e) => updateField("hips", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="thigh">Coxa (cm)</Label>
                <Input
                  id="thigh"
                  type="text"
                  placeholder="Ex: 60"
                  value={formData.thigh}
                  onChange={(e) => updateField("thigh", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="arm">Braço (cm)</Label>
                <Input
                  id="arm"
                  type="text"
                  placeholder="Ex: 38"
                  value={formData.arm}
                  onChange={(e) => updateField("arm", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações Adicionais</CardTitle>
              <CardDescription>Alguma informação importante que não foi mencionada?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="additionalNotes"
                placeholder="Escreva aqui qualquer informação adicional..."
                value={formData.additionalNotes}
                onChange={(e) => updateField("additionalNotes", e.target.value)}
                rows={5}
              />
            </CardContent>
          </Card>

          {/* Botão de Enviar */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="w-4 h-4 mr-2" />
              {isPending ? "Salvando..." : isEdit ? "Atualizar Anamnese" : "Salvar Anamnese"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
