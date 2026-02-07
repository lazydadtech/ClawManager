import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Use useEffect to handle navigation outside of render
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show loading while redirect happens
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 px-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <div className="text-6xl mb-4 font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            ◇
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Mission Control
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Command center for managing autonomous AI agents and complex task workflows
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground mb-6">
            Sign in to access your OpenClaw dashboard and manage your AI agents
          </p>
          <Button
            size="lg"
            onClick={() => {
              const loginUrl = new URL(window.location.href);
              loginUrl.pathname = "/api/oauth/login";
              window.location.href = loginUrl.toString();
            }}
            className="w-full sm:w-auto"
          >
            Sign In with Manus
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="font-semibold text-foreground mb-2">Real-time Sync</h3>
            <p className="text-sm text-muted-foreground">
              Live updates on agent status and task progress
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-foreground mb-2">Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track costs, metrics, and agent performance
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-semibold text-foreground mb-2">Agent Control</h3>
            <p className="text-sm text-muted-foreground">
              Manage tasks, workflows, and agent personalities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
