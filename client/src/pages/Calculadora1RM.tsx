import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Info } from "lucide-react";

export default function Calculadora1RM() {
  const [peso, setPeso] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [resultado, setResultado] = useState<{
    brzycki: number;
    epley: number;
    media: number;
  } | null>(null);

  // Fórmula de Brzycki: 1RM = peso / (1.0278 - 0.0278 × reps)
  const calcularBrzycki = (peso: number, reps: number): number => {
    if (reps === 1) return peso;
    return peso / (1.0278 - 0.0278 * reps);
  };

  // Fórmula de Epley: 1RM = peso × (1 + 0.0333 × reps)
  const calcularEpley = (peso: number, reps: number): number => {
    if (reps === 1) return peso;
    return peso * (1 + 0.0333 * reps);
  };

  const calcular = () => {
    const pesoNum = parseFloat(peso);
    const repsNum = parseInt(reps);

    if (isNaN(pesoNum) || isNaN(repsNum) || pesoNum <= 0 || repsNum <= 0 || repsNum > 12) {
      alert("Por favor, insira valores válidos. Repetições devem estar entre 1 e 12.");
      return;
    }

    const brzycki = calcularBrzycki(pesoNum, repsNum);
    const epley = calcularEpley(pesoNum, repsNum);
    const media = (brzycki + epley) / 2;

    setResultado({
      brzycki: Math.round(brzycki * 10) / 10,
      epley: Math.round(epley * 10) / 10,
      media: Math.round(media * 10) / 10,
    });
  };

  // Calcular percentuais de treino
  const calcularPercentuais = () => {
    if (!resultado) return [];
    
    const percentuais = [
      { label: "Força Máxima", percentual: 90, cor: "text-red-500" },
      { label: "Hipertrofia", percentual: 80, cor: "text-orange-500" },
      { label: "Resistência Muscular", percentual: 70, cor: "text-yellow-500" },
      { label: "Aquecimento", percentual: 60, cor: "text-green-500" },
    ];

    return percentuais.map(p => ({
      ...p,
      carga: Math.round(resultado.media * (p.percentual / 100) * 10) / 10,
    }));
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Calculadora de 1RM</h1>
          <p className="text-muted-foreground">Calcule sua carga máxima (1 Repetição Máxima)</p>
        </div>
      </div>

      {/* Card de Informação */}
      <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>1RM (1 Repetição Máxima)</strong> é o peso máximo que você consegue levantar uma única vez com técnica perfeita.
              </p>
              <p>
                Esta calculadora usa as fórmulas de <strong>Brzycki</strong> e <strong>Epley</strong> para estimar seu 1RM baseado em repetições submáximas (até 12 reps).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Cálculo */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Insira seus dados</CardTitle>
          <CardDescription>
            Digite o peso levantado e o número de repetições realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Peso Levantado (kg)</label>
              <Input
                type="number"
                placeholder="Ex: 80"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Repetições (1-12)</label>
              <Input
                type="number"
                placeholder="Ex: 8"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                min="1"
                max="12"
              />
            </div>
          </div>
          <Button onClick={calcular} className="w-full" size="lg">
            <Calculator className="w-4 h-4 mr-2" />
            Calcular 1RM
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {resultado && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Seu 1RM Estimado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Brzycki</div>
                  <div className="text-3xl font-bold text-primary">{resultado.brzycki}kg</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Epley</div>
                  <div className="text-3xl font-bold text-primary">{resultado.epley}kg</div>
                </div>
                <div className="text-center p-4 bg-primary text-primary-foreground rounded-lg">
                  <div className="text-sm mb-1 opacity-90">Média</div>
                  <div className="text-3xl font-bold">{resultado.media}kg</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Percentuais */}
          <Card>
            <CardHeader>
              <CardTitle>Cargas de Treino Recomendadas</CardTitle>
              <CardDescription>
                Baseado no seu 1RM de {resultado.media}kg
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calcularPercentuais().map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className={`font-semibold ${item.cor}`}>{item.label}</div>
                      <div className="text-sm text-muted-foreground">{item.percentual}% do 1RM</div>
                    </div>
                    <div className="text-2xl font-bold">{item.carga}kg</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-sm text-muted-foreground">
                  <strong>Dica:</strong> Use estas cargas como referência para planejar seus treinos. 
                  Para hipertrofia, trabalhe com 70-85% do 1RM. Para força, use 85-95%.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
