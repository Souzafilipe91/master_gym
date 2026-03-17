import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Dumbbell, 
  LayoutDashboard, 
  Library, 
  ClipboardList, 
  TrendingUp, 
  History,
  FileText,
  Menu,
  X,
  LogOut,
  Trophy,
  LineChart,
  Calculator,
  Settings
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { EditWeightDialog } from "./EditWeightDialog";

interface SidebarProps {
  className?: string;
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Meus Treinos",
    href: "/treinos",
    icon: Dumbbell,
  },
  {
    title: "Biblioteca",
    href: "/biblioteca",
    icon: Library,
  },
  {
    title: "Anamnese",
    href: "/anamnese",
    icon: ClipboardList,
  },
  {
    title: "Gerar Treino IA",
    href: "/gerar-treino",
    icon: FileText,
  },
  {
    title: "Progresso",
    href: "/progresso",
    icon: TrendingUp,
  },
  {
    title: "Evolução de Carga",
    href: "/evolucao",
    icon: LineChart,
  },
  {
    title: "Calculadora 1RM",
    href: "/calculadora-1rm",
    icon: Calculator,
  },
  {
    title: "Histórico",
    href: "/historico",
    icon: History,
  },
  {
    title: "Conquistas",
    href: "/conquistas",
    icon: Trophy,
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">Filipe Treinos</span>
          </div>
          <div className="w-10" /> {/* Spacer para centralizar */}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex flex-col h-full pt-14 md:pt-0">
          {/* Logo/Header */}
          <div className="p-6 border-b border-border">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Master Gym</h1>
                  <p className="text-xs text-muted-foreground">Programa de 1 Ano</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;

              return (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-border">
            <div className="mb-3 p-3 bg-background rounded-lg">
              <p className="text-sm font-medium truncate">{user?.name || "Filipe Pimenta de Souza"}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Peso: {user?.currentWeight || "83"}kg</p>
                <EditWeightDialog currentWeight={user?.currentWeight} />
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
            >
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
