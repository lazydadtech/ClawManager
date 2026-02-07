import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { MessageSquare, Users, Zap, Clock } from "lucide-react";

const agents = [
  {
    id: 1,
    name: "Jarvis",
    type: "commander",
    personality: "Strategic leader, excellent at planning and coordination",
    status: "active",
    currentTask: "Analyzing market trends",
    successRate: 98,
    tasksCompleted: 342,
    avgDuration: "2h 15m",
  },
  {
    id: 2,
    name: "The Architect",
    type: "sub_agent",
    personality: "Detail-oriented, focused on system optimization and audits",
    status: "active",
    currentTask: "System audit and improvement",
    successRate: 99,
    tasksCompleted: 156,
    avgDuration: "3h 45m",
  },
  {
    id: 3,
    name: "Data Processor",
    type: "sub_agent",
    personality: "Analytical, excels at data processing and reporting",
    status: "idle",
    currentTask: "Waiting for assignment",
    successRate: 97,
    tasksCompleted: 289,
    avgDuration: "1h 30m",
  },
];

const communications = [
  {
    id: 1,
    from: "Jarvis",
    to: "The Architect",
    type: "instruction",
    subject: "System Audit Request",
    content: "Please perform a comprehensive audit of Mission Control and identify any bugs or optimization opportunities.",
    timestamp: "2 minutes ago",
  },
  {
    id: 2,
    from: "The Architect",
    to: "Jarvis",
    type: "status_update",
    subject: "Audit Progress",
    content: "Audit 65% complete. Found 3 potential optimization areas. Will report full findings in 1 hour.",
    timestamp: "1 minute ago",
  },
  {
    id: 3,
    from: "Jarvis",
    to: "Data Processor",
    type: "instruction",
    subject: "Report Generation",
    content: "Generate quarterly performance report with focus on agent efficiency metrics.",
    timestamp: "30 minutes ago",
  },
  {
    id: 4,
    from: "Data Processor",
    to: "Jarvis",
    type: "status_update",
    subject: "Report Ready",
    content: "Quarterly report generated successfully. Available in Workshop for review.",
    timestamp: "25 minutes ago",
  },
];

function AgentCard({ agent }: { agent: (typeof agents)[0] }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              agent.type === "commander"
                ? "bg-purple-50 text-purple-700"
                : "bg-blue-50 text-blue-700"
            }`}>
              {agent.type === "commander" ? "COMMANDER" : "SUB-AGENT"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{agent.personality}</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${
          agent.status === "active" ? "bg-green-600 animate-pulse" : "bg-muted-foreground"
        }`} />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Current Activity</p>
          <p className="text-sm font-medium text-foreground">{agent.currentTask}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Success Rate</p>
            <p className="text-lg font-bold text-foreground mt-1">{agent.successRate}%</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Tasks Done</p>
            <p className="text-lg font-bold text-foreground mt-1">{agent.tasksCompleted}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Avg Duration</p>
            <p className="text-lg font-bold text-foreground mt-1 text-sm">{agent.avgDuration}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function AgentHub() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agent Hub</h1>
          <p className="text-muted-foreground mt-1">
            Manage agent hierarchy and monitor inter-agent communication
          </p>
        </div>

        {/* Agent Hierarchy Overview */}
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-foreground">Agent Hierarchy</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Jarvis (Commander) oversees 2 specialized sub-agents working collaboratively to execute complex tasks and improve system performance.
          </p>
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">👑</span>
              </div>
              <p className="font-medium text-foreground">Jarvis</p>
              <p className="text-xs text-muted-foreground">Commander</p>
            </div>
            <div className="text-muted-foreground">↓</div>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🏗️</span>
                </div>
                <p className="font-medium text-foreground">The Architect</p>
                <p className="text-xs text-muted-foreground">Sub-Agent</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">📊</span>
                </div>
                <p className="font-medium text-foreground">Data Processor</p>
                <p className="text-xs text-muted-foreground">Sub-Agent</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Agents Grid */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Agent Profiles</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        {/* Inter-Agent Communication Log */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Communication Log</h2>
          <Card className="p-6">
            <div className="space-y-4">
              {communications.map((comm) => (
                <div
                  key={comm.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">{comm.from}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-foreground">{comm.to}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{comm.timestamp}</span>
                  </div>

                  <div className="mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      comm.type === "instruction"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-green-50 text-green-700"
                    }`}>
                      {comm.type === "instruction" ? "INSTRUCTION" : "STATUS UPDATE"}
                    </span>
                  </div>

                  <h4 className="font-medium text-foreground mb-1">{comm.subject}</h4>
                  <p className="text-sm text-muted-foreground">{comm.content}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Agent Collaboration Info */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <h3 className="font-semibold text-foreground mb-2">About Agent Collaboration</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Agents communicate through structured messages to coordinate work, share status updates, and plan future activities. All communications are logged for transparency and audit purposes.
          </p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>✓ Real-time inter-agent messaging</li>
            <li>✓ Hierarchical task delegation from Commander to Sub-Agents</li>
            <li>✓ Automatic status synchronization</li>
            <li>✓ Complete audit trail of all communications</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
