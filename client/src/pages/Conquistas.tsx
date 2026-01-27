import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Trophy, Lock, Star, TrendingUp, Calendar, Dumbbell, Flame, Target, Award, Zap } from "lucide-react";
import { useMemo } from "react";

// Mapeamento de ícones
const iconMap: Record<string, any> = {
  Trophy,
  Lock,
  Star,
  TrendingUp,
  Calendar,
  Dumbbell,
  Flame,
  Target,
  Award,
  Zap,
};

export default function Conquistas() {
  const { data: allAchievements, isLoading: loadingAll } = trpc.achievements.getAll.useQuery();
  const { data: userAchievements, isLoading: loadingUser } = trpc.achievements.getMy.useQuery();

  // Criar um mapa de conquistas desbloqueadas
  const unlockedMap = useMemo(() => {
    const map = new Map<number, any>();
    userAchievements?.forEach(ua => {
      map.set(ua.achievementId, ua);
    });
    return map;
  }, [userAchievements]);

  // Agrupar conquistas por categoria
  const achievementsByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    allAchievements?.forEach(achievement => {
      if (!grouped[achievement.category]) {
        grouped[achievement.category] = [];
      }
      const isUnlocked = unlockedMap.has(achievement.id);
      const userAchievement = unlockedMap.get(achievement.id);
      grouped[achievement.category].push({
        ...achievement,
        isUnlocked,
        unlockedAt: userAchievement?.unlockedAt,
      });
    });
    return grouped;
  }, [allAchievements, unlockedMap]);

  const categoryNames: Record<string, string> = {
    frequency: "Frequência",
    milestone: "Marcos",
    pr: "Recordes Pessoais",
    streak: "Sequências",
  };

  const totalAchievements = allAchievements?.length || 0;
  const unlockedCount = userAchievements?.length || 0;
  const totalPoints = userAchievements?.reduce((sum, ua) => sum + (ua.points || 0), 0) || 0;

  if (loadingAll || loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 animate-bounce mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando conquistas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Conquistas</h1>
              <p className="text-muted-foreground">Desbloqueie badges e mostre seu progresso</p>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-3xl font-bold text-primary">{unlockedCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Desbloqueadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-3xl font-bold">{totalAchievements}</div>
                <p className="text-xs text-muted-foreground mt-1">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-3xl font-bold text-yellow-500">{totalPoints}</div>
                <p className="text-xs text-muted-foreground mt-1">Pontos</p>
              </CardContent>
            </Card>
          </div>

          {/* Barra de Progresso */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso Geral</span>
              <span className="font-semibold">{Math.round((unlockedCount / totalAchievements) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-primary to-yellow-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(unlockedCount / totalAchievements) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {Object.entries(achievementsByCategory).map(([category, achievements]) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{categoryNames[category] || category}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => {
                const IconComponent = iconMap[achievement.icon] || Trophy;
                const isUnlocked = achievement.isUnlocked;

                return (
                  <Card 
                    key={achievement.id} 
                    className={`relative overflow-hidden transition-all ${
                      isUnlocked 
                        ? 'border-primary/50 bg-gradient-to-br from-card to-primary/5' 
                        : 'opacity-60 grayscale'
                    }`}
                  >
                    {isUnlocked && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="default" className="bg-green-500">
                          <Star className="w-3 h-3 mr-1" />
                          Desbloqueada
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          isUnlocked 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isUnlocked ? (
                            <IconComponent className="w-8 h-8" />
                          ) : (
                            <Lock className="w-8 h-8" />
                          )}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{achievement.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {achievement.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          <Target className="w-4 h-4 inline mr-1" />
                          Requisito: {achievement.requirement}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                          <Star className="w-4 h-4" />
                          {achievement.points}
                        </div>
                      </div>
                      
                      {isUnlocked && achievement.unlockedAt && (
                        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                          Desbloqueada em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {totalAchievements === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma conquista disponível</h3>
              <p className="text-muted-foreground">
                As conquistas serão adicionadas em breve. Continue treinando!
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
