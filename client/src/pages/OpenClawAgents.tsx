import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, RefreshCw, Settings, Play, Pause } from "lucide-react";
import { AgentListView } from "@/components/openclaw/AgentListView";
import { AgentDetailModal } from "@/components/openclaw/AgentDetailModal";
import { ConnectionSettingsModal } from "@/components/openclaw/ConnectionSettingsModal";
import { CommandExecutionModal } from "@/components/openclaw/CommandExecutionModal";
import { useToast } from "@/hooks/useToast";

interface SelectedAgent {
  id: string;
  name: string;
}

export function OpenClawAgents() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgent | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(false);

  // Queries
  const { data: agentsResult, isLoading: agentsLoading, refetch: refetchAgents } = trpc.openclaw.getAgents.useQuery();
  const { data: statusResult } = trpc.openclaw.getPollingStatus.useQuery();
  const { data: healthResult } = trpc.openclaw.healthCheck.useQuery();

  // Mutations
  const { mutate: connect } = trpc.openclaw.connect.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Connected",
          description: "Successfully connected to OpenClaw host",
          variant: "success",
        });
        setShowSettings(false);
        refetchAgents();
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    },
  });

  const { mutate: startPolling } = trpc.openclaw.startPolling.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setIsPollingActive(true);
        toast({
          title: "Polling Started",
          description: result.message,
          variant: "success",
        });
      }
    },
  });

  const { mutate: stopPolling } = trpc.openclaw.stopPolling.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setIsPollingActive(false);
        toast({
          title: "Polling Stopped",
          description: result.message,
          variant: "success",
        });
      }
    },
  });

  const { mutate: triggerPolling } = trpc.openclaw.triggerPolling.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Polling Triggered",
          description: `Polled ${result.agentsPolled} agents`,
          variant: "success",
        });
        refetchAgents();
      }
    },
  });

  // Update polling status
  useEffect(() => {
    if (statusResult?.status.isRunning) {
      setIsPollingActive(true);
    }
  }, [statusResult]);

  // Filter agents
  const agents = agentsResult?.agents || [];
  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isConnected = healthResult?.healthy ?? false;
  const pollingStats = statusResult?.status;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OpenClaw Agents</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of your OpenClaw agents
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAgents()}
            disabled={agentsLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connection Status</span>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-lg font-semibold">
                {isConnected ? "Online" : "Offline"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Agents</div>
              <div className="text-lg font-semibold">{agents.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Polling</div>
              <Badge variant={isPollingActive ? "default" : "secondary"}>
                {isPollingActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Run</div>
              <div className="text-sm">
                {pollingStats?.lastRun
                  ? new Date(pollingStats.lastRun).toLocaleTimeString()
                  : "Never"}
              </div>
            </div>
          </div>

          {/* Polling Controls */}
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              onClick={() => (isPollingActive ? stopPolling() : startPolling())}
            >
              {isPollingActive ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Polling
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Polling
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => triggerPolling()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Manual Poll
            </Button>
          </div>

          {pollingStats?.lastError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">{pollingStats.lastError}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Polling Statistics */}
      {pollingStats && (
        <Card>
          <CardHeader>
            <CardTitle>Polling Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Runs</div>
                <div className="text-2xl font-bold">{pollingStats.totalRuns}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Successful</div>
                <div className="text-2xl font-bold text-green-600">
                  {pollingStats.successfulRuns}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Failed</div>
                <div className="text-2xl font-bold text-red-600">
                  {pollingStats.failedRuns}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
                <div className="text-2xl font-bold">
                  {pollingStats.totalRuns > 0
                    ? Math.round(
                        (pollingStats.successfulRuns / pollingStats.totalRuns) * 100
                      )
                    : 0}
                  %
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div>
        <Input
          placeholder="Search agents by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Agent List */}
      {agentsLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Loading agents...
            </div>
          </CardContent>
        </Card>
      ) : filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {agents.length === 0
                ? "No agents connected. Configure OpenClaw host in settings."
                : "No agents match your search."}
            </div>
          </CardContent>
        </Card>
      ) : (
        <AgentListView
          agents={filteredAgents}
          onSelectAgent={(agent: SelectedAgent) => setSelectedAgent(agent)}
        />
      )}

      {/* Modals */}
      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          isOpen={!!selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onExecuteCommand={() => {
            setShowCommandModal(true);
          }}
        />
      )}

      {selectedAgent && showCommandModal && (
        <CommandExecutionModal
          agent={selectedAgent}
          isOpen={showCommandModal}
          onClose={() => setShowCommandModal(false)}
          onSuccess={() => {
            toast({
              title: "Command Executed",
              description: "Command sent successfully",
              variant: "success",
            });
            refetchAgents();
          }}
        />
      )}

      <ConnectionSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onConnect={connect}
      />
    </div>
  );
}
