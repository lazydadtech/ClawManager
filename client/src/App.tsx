import { useCallback, useMemo, useState } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import MissionControl from "./pages/MissionControl";
import Workshop from "./pages/Workshop";
import FinancialDashboard from "./pages/FinancialDashboard";
import CronJobs from "./pages/CronJobs";
import DocuDigest from "./pages/DocuDigest";
import AgentHub from "./pages/AgentHub";
import BackupRestore from "./pages/BackupRestore";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={MissionControl} />
      <Route path="/workshop" component={Workshop} />
      <Route path="/financial" component={FinancialDashboard} />
      <Route path="/cron-jobs" component={CronJobs} />
      <Route path="/docu-digest" component={DocuDigest} />
      <Route path="/agent-hub" component={AgentHub} />
      <Route path="/backup-restore" component={BackupRestore} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
