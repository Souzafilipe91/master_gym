import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Dumbbell, TrendingUp, Calendar, Activity } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

function AuthScreen() {
  const utils = trpc.useUtils();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    registerMutation.mutate({ name: regName, email: regEmail, password: regPassword });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Dumbbell className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Gym Master
          </h1>
          <p className="text-muted-foreground mt-2">Programa de Treino Personalizado</p>
        </div>

        <div className="grid gap-4 grid-cols-3 mb-6">
          <div className="text-center p-3 bg-card rounded-lg border border-border">
            <Calendar className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-xs font-semibold">4 Ciclos</p>
            <p className="text-xs text-muted-foreground">52 Semanas</p>
          </div>
          <div className="text-center p-3 bg-card rounded-lg border border-border">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-xs font-semibold">Progressão</p>
            <p className="text-xs text-muted-foreground">Automática</p>
          </div>
          <div className="text-center p-3 bg-card rounded-lg border border-border">
            <Activity className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-xs font-semibold">Treinos</p>
            <p className="text-xs text-muted-foreground">A, B, C, D</p>
          </div>
        </div>

        <Card className="border-primary/30 shadow-2xl shadow-primary/20">
          <CardContent className="pt-6">
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nome</Label>
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Senha</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm">Confirmar Senha</Label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={regConfirm}
                      onChange={e => setRegConfirm(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Cadastrando..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default function Home() {
  const { loading, isAuthenticated } = useAuth();
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
    return <AuthScreen />;
  }

  const currentCycle = cycles?.[0];

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
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
          </div>
        </div>
      </main>
    </div>
  );
}
