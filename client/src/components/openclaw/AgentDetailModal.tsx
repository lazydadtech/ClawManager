import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, Command } from "lucide-react";

interface AgentDetailModalProps {
  agent: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: () => void;
}

export function AgentDetailModal({
  agent,
  isOpen,
  onClose,
  onExecuteCommand,
}: AgentDetailModalProps) {
  const { data: agentResult, isLoading } = trpc.openclaw.getAgent.useQuery({
    agentId: agent.id,
  });

  const { data: metricsResult } = trpc.openclaw.getAgentMetrics.useQuery({
    agentId: agent.id,
  });

  const agentData = agentResult?.agent;
  const metrics = metricsResult?.metrics;

  // Mock metrics data for chart (in real app, would fetch from backend)
  const chartData = [
    { time: "00:00", uptime: 3600, tasks: 10 },
    { time: "06:00", uptime: 21600, tasks: 25 },
    { time: "12:00", uptime: 43200, tasks: 45 },
    { time: "18:00", uptime: 64800, tasks: 78 },
    { time: "24:00", uptime: 86400, tasks: 120 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{agent.name}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Agent Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Agent ID</div>
                      <div className="font-mono text-sm">{agentData?.id}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <Badge variant="default">
                        {agentData?.status === "online" ? "🟢" : "⚫"}{" "}
                        {agentData?.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Type</div>
                      <div className="text-sm">{agentData?.type}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Last Seen</div>
                      <div className="text-sm">
                        {agentData?.lastSeen
                          ? new Date(agentData.lastSeen).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {agentData?.metadata && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {Object.entries(agentData.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4">
              {metrics ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Current Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                        <div className="text-2xl font-bold">
                          {Math.floor(metrics.uptime / 3600)}h{" "}
                          {Math.floor((metrics.uptime % 3600) / 60)}m
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Tasks Completed</div>
                        <div className="text-2xl font-bold">{metrics.tasksCompleted}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Tasks Failed</div>
                        <div className="text-2xl font-bold text-red-600">
                          {metrics.tasksFailed}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Last Activity</div>
                        <div className="text-sm">
                          {new Date(metrics.lastActivity).toLocaleTimeString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Uptime Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="uptime"
                            stroke="#3b82f6"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tasks Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="tasks"
                            stroke="#10b981"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      No metrics available
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Agent Commands</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Execute commands on this agent to control its behavior.
                  </p>
                  <Button
                    className="w-full"
                    onClick={onExecuteCommand}
                  >
                    <Command className="w-4 h-4 mr-2" />
                    Execute Command
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
