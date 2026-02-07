import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const dailyData = [
  { date: "Mon", cost: 24.5, requests: 1200 },
  { date: "Tue", cost: 32.1, requests: 1400 },
  { date: "Wed", cost: 28.7, requests: 1100 },
  { date: "Thu", cost: 35.2, requests: 1600 },
  { date: "Fri", cost: 41.8, requests: 1900 },
  { date: "Sat", cost: 18.3, requests: 800 },
  { date: "Sun", cost: 22.5, requests: 950 },
];

const apiUsage = [
  { name: "GPT-4", cost: 145.32, percentage: 45, requests: 2400 },
  { name: "Claude", cost: 98.50, percentage: 30, requests: 1600 },
  { name: "Embeddings", cost: 54.20, percentage: 17, requests: 3200 },
  { name: "Other", cost: 22.98, percentage: 8, requests: 450 },
];

export default function FinancialDashboard() {
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

  const totalCost = apiUsage.reduce((sum, api) => sum + api.cost, 0);
  const dailyAverage = (dailyData.reduce((sum, day) => sum + day.cost, 0) / dailyData.length).toFixed(2);
  const monthlyProjection = (totalCost * 4.3).toFixed(2);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time API usage tracking and cost analysis
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold text-foreground mt-2">${totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">Total API spend</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Daily Average</p>
                <p className="text-3xl font-bold text-foreground mt-2">${dailyAverage}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">7-day average</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Projection</p>
                <p className="text-3xl font-bold text-foreground mt-2">${monthlyProjection}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">Estimated monthly cost</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Status</p>
                <p className="text-3xl font-bold text-foreground mt-2">72%</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">Of monthly budget</p>
          </Card>
        </div>

        {/* Spending Alert */}
        <Card className="p-4 bg-yellow-50 border-yellow-200 border-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-700 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900">Spending Alert</h3>
              <p className="text-sm text-yellow-800 mt-1">
                You've reached 72% of your monthly budget. Consider optimizing API usage or increasing budget limits.
              </p>
            </div>
          </div>
        </Card>

        {/* Daily Spending Chart */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Daily Spending Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="var(--accent-green)"
                strokeWidth={2}
                dot={{ fill: "var(--accent-green)" }}
                name="Cost ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* API Usage Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">API Usage by Service</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={apiUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="cost" fill="var(--accent-blue)" name="Cost ($)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Cost Breakdown</h2>
            <div className="space-y-4">
              {apiUsage.map((api) => (
                <div key={api.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">{api.name}</p>
                      <p className="text-xs text-muted-foreground">{api.requests} requests</p>
                    </div>
                    <p className="font-semibold text-foreground">${api.cost.toFixed(2)}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${api.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
