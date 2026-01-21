import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Biblioteca from "./pages/Biblioteca";
import TreinoDetalhes from "./pages/TreinoDetalhes";
import Historico from "./pages/Historico";
import Progresso from "./pages/Progresso";
import Anamnese from "./pages/Anamnese";
import AnamneseForm from "./pages/AnamneseForm";
import GerarTreino from "./pages/GerarTreino";
import MeusTreinos from "./pages/MeusTreinos";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Layout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/biblioteca"} component={Biblioteca} />
        <Route path={"/treino/:code"} component={TreinoDetalhes} />
        <Route path={"/historico"} component={Historico} />
        <Route path={"/progresso"} component={Progresso} />
        <Route path={"/anamnese"} component={Anamnese} />
        <Route path={"/anamnese/preencher"} component={AnamneseForm} />
        <Route path={"/gerar-treino"} component={GerarTreino} />
        <Route path={"/treinos"} component={MeusTreinos} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
