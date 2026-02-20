import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Dumbbell, TrendingUp, User, Calendar, Activity } from "lucide-react";
import { Link } from "wouter";
import { NotificationSettings } from "@/components/NotificationSettings";
import { WeeklyProgressWidget } from "@/components/WeeklyProgressWidget";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: cycles } = trpc.cycles.getAll.useQuery();


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container max-w-4xl">
          <Card className="border-primary/30 shadow-2xl shadow-primary/20">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Dumbbell className="w-16 h-16 text-primary" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Filipe Treinos
                </span>
              </CardTitle>
              <CardDescription className="text-lg">
                Programa de Treino Personalizado de 1 Ano
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-card rounded-lg border border-border">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">4 Ciclos</h3>
                  <p className="text-sm text-muted-foreground">52 Semanas</p>
                </div>
                <div className="text-center p-4 bg-card rounded-lg border border-border">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Progressão</h3>
                  <p className="text-sm text-muted-foreground">Automática</p>
                </div>
                <div className="text-center p-4 bg-card rounded-lg border border-border">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Treinos</h3>
                  <p className="text-sm text-muted-foreground">A, B, C, D</p>
                </div>
              </div>
              <div className="text-center pt-4">
                <Button asChild size="lg" className="w-full md:w-auto">
                  <a href={getLoginUrl()}>
                    <User className="w-4 h-4 mr-2" />
                    Entrar na Plataforma
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Dashboard para usuário autenticado
  const currentCycle = cycles?.[0]; // Por enquanto, sempre mostra o primeiro ciclo

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Ciclo Atual */}
        <div className="mb-8">
          <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">Ciclo Atual</CardTitle>
              <CardDescription>{currentCycle?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Objetivo</p>
                  <p className="font-medium">{currentCycle?.objective}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Foco</p>
                  <p className="font-medium">{currentCycle?.focus}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Período</p>
                  <p className="font-medium">Semanas {currentCycle?.startWeek}-{currentCycle?.endWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progresso Semanal */}
        <div className="mb-8">
          <WeeklyProgressWidget />
        </div>

        {/* Notificações */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Notificações</h2>
          <NotificationSettings />
        </div>

        {/* Acesso Rápido */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Acesso Rápido</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/treinos">
              <Card className="hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-primary" />
                    Meus Treinos
                  </CardTitle>
                  <CardDescription>Ver todos os treinos (A, B, C, D)</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/biblioteca">
              <Card className="hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle>Biblioteca de Exercícios</CardTitle>
                  <CardDescription>Explore todos os exercícios disponíveis</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/historico">
              <Card className="hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle>Histórico</CardTitle>
                  <CardDescription>Veja seus treinos realizados</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/evolucao">
              <Card className="hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle>Evolução</CardTitle>
                  <CardDescription>Gráficos de progressão de carga</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/progresso">
              <Card className="hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle>Progresso</CardTitle>
                  <CardDescription>Acompanhe sua evolução</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
