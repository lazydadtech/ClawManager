import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const columns = [
  { id: "queued", label: "QUEUED", color: "bg-blue-50", borderColor: "border-blue-200" },
  { id: "in_progress", label: "IN PROGRESS", color: "bg-orange-50", borderColor: "border-orange-200" },
  { id: "completed", label: "COMPLETED", color: "bg-green-50", borderColor: "border-green-200" },
];

const mockTasks = {
  queued: [
    {
      id: 1,
      title: "Analyze market trends",
      description: "Review latest market data and competitor analysis",
      momentum: 95,
      agent: "Jarvis",
      tags: ["analysis", "market"],
    },
    {
      id: 2,
      title: "Generate quarterly report",
      description: "Create comprehensive quarterly performance report",
      momentum: 78,
      agent: "Data Processor",
      tags: ["reporting"],
    },
  ],
  in_progress: [
    {
      id: 3,
      title: "Process customer feedback",
      description: "Analyze and categorize customer feedback from this month",
      momentum: 100,
      agent: "Jarvis",
      tags: ["feedback", "analysis"],
    },
  ],
  completed: [
    {
      id: 4,
      title: "System audit",
      description: "Completed comprehensive system audit and optimization",
      momentum: 88,
      agent: "The Architect",
      tags: ["maintenance"],
      duration: "2h 15m",
    },
    {
      id: 5,
      title: "Data cleanup",
      description: "Cleaned and normalized database records",
      momentum: 92,
      agent: "Data Processor",
      tags: ["maintenance"],
      duration: "1h 30m",
    },
  ],
};

function TaskCard({ task, columnId }: { task: any; columnId: string }) {
  return (
    <div className="p-4 bg-white rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
          {task.title}
        </h3>
        {columnId === "in_progress" && (
          <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-foreground">👤</span>
          <span className="text-xs text-muted-foreground">{task.agent}</span>
        </div>
        {columnId === "completed" && task.duration && (
          <span className="text-xs text-muted-foreground">⏱ {task.duration}</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag: string) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 bg-muted rounded text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-primary">{task.momentum}%</div>
          <div className="text-[10px] text-muted-foreground">momentum</div>
        </div>
      </div>
    </div>
  );
}

export default function Workshop() {
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Workshop</h1>
            <p className="text-muted-foreground mt-1">
              Manage tasks and monitor agent workflow
            </p>
          </div>
          <Button className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col">
              <div className={`p-4 rounded-t-lg ${column.color} border ${column.borderColor} border-b-0`}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground text-sm">{column.label}</h2>
                  <span className="text-xs font-bold text-muted-foreground bg-white px-2 py-1 rounded">
                    {mockTasks[column.id as keyof typeof mockTasks].length}
                  </span>
                </div>
              </div>

              <div className={`flex-1 p-4 space-y-3 rounded-b-lg border ${column.borderColor} border-t-0 bg-white/50`}>
                {mockTasks[column.id as keyof typeof mockTasks].map((task) => (
                  <TaskCard key={task.id} task={task} columnId={column.id} />
                ))}

                {mockTasks[column.id as keyof typeof mockTasks].length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <p className="text-sm">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Momentum Ranking Info */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <h3 className="font-semibold text-foreground mb-2">About Momentum Ranking</h3>
          <p className="text-sm text-muted-foreground">
            Tasks are ranked based on their alignment with agent capabilities and previous successes. A 100% momentum score indicates perfect fit for the assigned agent, enabling faster execution and skill building.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
