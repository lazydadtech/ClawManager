import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Activity, Zap, Clock, Gauge } from "lucide-react";

export default function MissionControl() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mission Control</h1>
            <p className="text-muted-foreground mt-1">
              Real-time monitoring of your OpenClaw agents
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-semibold text-foreground tabular-nums">
                {formatTime(time)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(time)}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-700 rounded-full animate-pulse" />
              ONLINE
            </div>
          </div>
        </div>

        {/* Agent Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
                <p className="text-3xl font-bold text-foreground mt-2">3</p>
              </div>
              <Zap className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">All agents operational</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks in Queue</p>
                <p className="text-3xl font-bold text-foreground mt-2">12</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">5 in progress</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Heartbeat</p>
                <p className="text-3xl font-bold text-foreground mt-2">2m 15s</p>
              </div>
              <Clock className="w-8 h-8 text-green-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">Scheduled check-in</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bandwidth</p>
                <p className="text-3xl font-bold text-foreground mt-2">87%</p>
              </div>
              <Gauge className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">Available capacity</p>
          </Card>
        </div>

        {/* Agent Activity Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Current Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="font-medium text-foreground">Jarvis (Commander)</p>
                <p className="text-sm text-muted-foreground">Analyzing market trends</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-blue-600">ACTIVE</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="font-medium text-foreground">The Architect (Sub-Agent)</p>
                <p className="text-sm text-muted-foreground">System audit and optimization</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-600">ACTIVE</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">Data Processor</p>
                <p className="text-sm text-muted-foreground">Waiting for task assignment</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                <span className="text-xs font-medium text-muted-foreground">IDLE</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Commitments */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Commitments</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">Analyze competitor pricing</p>
                <p className="text-xs text-muted-foreground">Assigned to Jarvis • 2m ago</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                IN PROGRESS
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">Generate weekly report</p>
                <p className="text-xs text-muted-foreground">Assigned to Data Processor • 5m ago</p>
              </div>
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                QUEUED
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">System audit and optimization</p>
                <p className="text-xs text-muted-foreground">Assigned to The Architect • 1h ago</p>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                COMPLETED
              </span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
