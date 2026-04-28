import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { OnlineStatus } from "./components/OnlineStatus";
import { Layout } from "./components/Layout";
import Biblioteca from "./pages/Biblioteca";
import TreinoDetalhes from "./pages/TreinoDetalhes";
import Historico from "./pages/Historico";
import Progresso from "./pages/Progresso";
import Anamnese from "./pages/Anamnese";
import AnamneseForm from "./pages/AnamneseForm";
import GerarTreino from "./pages/GerarTreino";
import MeusTreinos from "./pages/MeusTreinos";
import ExecutarTreino from "./pages/ExecutarTreino";
import Conquistas from "./pages/Conquistas";
import EvolucaoCarga from "./pages/EvolucaoCarga";
import Calculadora1RM from "./pages/Calculadora1RM";
import Configuracoes from "./pages/Configuracoes";
import Personalizacao from "./pages/Personalizacao";
import Calistenia from "./pages/Calistenia";
import TreinosSalvos from "./pages/TreinosSalvos";
import CopiarTreino from "./pages/CopiarTreino";
import ExecutarTreinoIA from "./pages/ExecutarTreinoIA";
import GerarDieta from "./pages/GerarDieta";
import MinhasDietas from "./pages/MinhasDietas";
import ContadorCalorias from "./pages/ContadorCalorias";
import { LockScreenWidgetManager } from "./components/LockScreenWidgetManager";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <LockScreenWidgetManager />
      <Layout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/biblioteca"} component={Biblioteca} />
        <Route path={"/treino/:code"} component={TreinoDetalhes} />
        <Route path={"/treino/:code/registrar"} component={ExecutarTreino} />
        <Route path={"/historico"} component={Historico} />
        <Route path={"/progresso"} component={Progresso} />
        <Route path={"/anamnese"} component={Anamnese} />
        <Route path={"/anamnese/preencher"} component={AnamneseForm} />
        <Route path={"/gerar-treino"} component={GerarTreino} />
        <Route path={"/treinos"} component={MeusTreinos} />
        <Route path={"/conquistas"} component={Conquistas} />
        <Route path={"/evolucao"} component={EvolucaoCarga} />
        <Route path={"/calculadora-1rm"} component={Calculadora1RM} />
        <Route path={"/configuracoes"} component={Configuracoes} />
        <Route path={"/personalizacao"} component={Personalizacao} />
        <Route path={"/calistenia"} component={Calistenia} />
        <Route path={"/copiar-treino"} component={CopiarTreino} />
        <Route path={"/treinos-salvos"} component={TreinosSalvos} />
        <Route path={"/treino-ia/:id/executar"} component={ExecutarTreinoIA} />
        <Route path={"/gerar-dieta"} component={GerarDieta} />
        <Route path={"/dieta"} component={MinhasDietas} />
        <Route path={"/dieta/:id"} component={MinhasDietas} />
        <Route path={"/contador-calorias"} component={ContadorCalorias} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
      </Layout>
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <OnlineStatus />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
