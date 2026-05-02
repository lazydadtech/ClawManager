import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Activity } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type: "main" | "dm" | "group";
  status: "online" | "offline" | "idle" | "error";
  lastSeen: string;
  metadata?: Record<string, any>;
}

interface AgentListViewProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
}

const statusColors: Record<string, string> = {
  online: "bg-green-100 text-green-800",
  offline: "bg-gray-100 text-gray-800",
  idle: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
};

const typeLabels = {
  main: "Main Agent",
  dm: "Direct Message",
  group: "Group Agent",
};

export function AgentListView({ agents, onSelectAgent }: AgentListViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <Card key={agent.id} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{agent.id}</p>
              </div>
              <Badge className={statusColors[agent.status] || statusColors.offline}>
                {agent.status === "online" ? "🟢" : agent.status === "offline" ? "⚫" : "🔴"}{" "}
                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Type */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant="outline">{typeLabels[agent.type]}</Badge>
            </div>

            {/* Last Seen */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last Seen
              </span>
              <span className="text-sm">
                {new Date(agent.lastSeen).toLocaleTimeString()}
              </span>
            </div>

            {/* Metadata */}
            {agent.metadata && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-2">Details</div>
                <div className="space-y-1">
                  {agent.metadata.channel && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Channel:</span>{" "}
                      <span className="font-mono">{agent.metadata.channel}</span>
                    </div>
                  )}
                  {agent.metadata.userId && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">User:</span>{" "}
                      <span className="font-mono">{agent.metadata.userId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              className="w-full mt-4"
              onClick={() => onSelectAgent(agent)}
            >
              <Activity className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
