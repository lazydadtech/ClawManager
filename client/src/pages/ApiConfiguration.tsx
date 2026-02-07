import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Loader2, Plus, Trash2, TestTube } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ApiConfig {
  id: number;
  name: string;
  apiEndpoint: string;
  authMethod: "api_key" | "oauth" | "bearer_token";
  pollingInterval: number;
  connectionType: "websocket" | "sse" | "http_polling";
  isActive: boolean;
  testStatus?: "success" | "failed" | "pending";
  lastTestedAt?: string;
}

export default function ApiConfiguration() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    apiEndpoint: "",
    authMethod: "api_key" as const,
    apiKey: "",
    bearerToken: "",
    pollingInterval: 5000,
    connectionType: "http_polling" as const,
  });

  const handleAddConfig = async () => {
    if (!formData.name || !formData.apiEndpoint) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call tRPC procedure to save API configuration
      toast.success("API configuration saved successfully");
      setFormData({
        name: "",
        apiEndpoint: "",
        authMethod: "api_key",
        apiKey: "",
        bearerToken: "",
        pollingInterval: 5000,
        connectionType: "http_polling",
      });
      setShowForm(false);
    } catch (error) {
      toast.error("Failed to save API configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (configId: number) => {
    setTestingId(configId);
    try {
      // TODO: Call tRPC procedure to test API connection
      toast.success("Connection test successful");
    } catch (error) {
      toast.error("Connection test failed");
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteConfig = async (configId: number) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;

    try {
      // TODO: Call tRPC procedure to delete API configuration
      setConfigs(configs.filter(c => c.id !== configId));
      toast.success("Configuration deleted");
    } catch (error) {
      toast.error("Failed to delete configuration");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">API Configuration</h1>
        <p className="text-muted-foreground">
          Configure your OpenClaw API connections for real-time monitoring
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">API Connections</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring Settings</TabsTrigger>
        </TabsList>

        {/* API Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          {/* Add New Configuration */}
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add API Configuration
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Add New API Configuration</CardTitle>
                <CardDescription>
                  Configure a new OpenClaw API endpoint for monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="config-name">Configuration Name *</Label>
                  <Input
                    id="config-name"
                    placeholder="e.g., Production OpenClaw"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* API Endpoint */}
                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">API Endpoint URL *</Label>
                  <Input
                    id="api-endpoint"
                    type="url"
                    placeholder="https://api.openclaw.example.com"
                    value={formData.apiEndpoint}
                    onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                  />
                </div>

                {/* Authentication Method */}
                <div className="space-y-2">
                  <Label htmlFor="auth-method">Authentication Method *</Label>
                  <Select value={formData.authMethod} onValueChange={(value: any) => setFormData({ ...formData, authMethod: value })}>
                    <SelectTrigger id="auth-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="bearer_token">Bearer Token</SelectItem>
                      <SelectItem value="oauth">OAuth 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* API Key */}
                {formData.authMethod === "api_key" && (
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key *</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter your API key"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    />
                  </div>
                )}

                {/* Bearer Token */}
                {(formData.authMethod as string) === "bearer_token" && (
                  <div className="space-y-2">
                    <Label htmlFor="bearer-token">Bearer Token *</Label>
                    <Input
                      id="bearer-token"
                      type="password"
                      placeholder="Enter your bearer token"
                      value={formData.bearerToken}
                      onChange={(e) => setFormData({ ...formData, bearerToken: e.target.value })}
                    />
                  </div>
                )}

                {/* Connection Type */}
                <div className="space-y-2">
                  <Label htmlFor="connection-type">Connection Type</Label>
                  <Select value={formData.connectionType} onValueChange={(value: any) => setFormData({ ...formData, connectionType: value })}>
                    <SelectTrigger id="connection-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="websocket">WebSocket (Real-time)</SelectItem>
                      <SelectItem value="sse">Server-Sent Events</SelectItem>
                      <SelectItem value="http_polling">HTTP Polling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Polling Interval */}
                <div className="space-y-2">
                  <Label htmlFor="polling-interval">Polling Interval (milliseconds)</Label>
                  <Input
                    id="polling-interval"
                    type="number"
                    min="1000"
                    step="1000"
                    value={formData.pollingInterval}
                    onChange={(e) => setFormData({ ...formData, pollingInterval: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    How often to fetch updates (minimum 1000ms)
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddConfig} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Configuration
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Configurations */}
          <div className="space-y-4">
            {configs.length === 0 && !showForm ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No API configurations yet. Add one to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              configs.map((config) => (
                <Card key={config.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {config.name}
                          {config.isActive && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Active
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>{config.apiEndpoint}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConfig(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium">Authentication</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {config.authMethod.replace("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Connection Type</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {config.connectionType.replace("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Polling Interval</p>
                        <p className="text-sm text-muted-foreground">
                          {config.pollingInterval}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Test</p>
                        <p className="text-sm text-muted-foreground">
                          {config.lastTestedAt ? new Date(config.lastTestedAt).toLocaleString() : "Never"}
                        </p>
                      </div>
                    </div>

                    {/* Test Status */}
                    {config.testStatus && (
                      <div className={`flex items-center gap-2 rounded-lg p-3 ${
                        config.testStatus === "success" ? "bg-green-50" : "bg-red-50"
                      }`}>
                        {config.testStatus === "success" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          config.testStatus === "success" ? "text-green-800" : "text-red-800"
                        }`}>
                          {config.testStatus === "success" ? "Connection Successful" : "Connection Failed"}
                        </span>
                      </div>
                    )}

                    {/* Test Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(config.id)}
                      disabled={testingId === config.id}
                    >
                      {testingId === config.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Connection
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Monitoring Settings Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Preferences</CardTitle>
              <CardDescription>
                Configure alert thresholds and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Alert Thresholds */}
              <div className="space-y-4">
                <h3 className="font-semibold">Alert Thresholds</h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="error-rate-critical">Critical Error Rate (%)</Label>
                    <Input id="error-rate-critical" type="number" min="0" max="100" defaultValue="10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="error-rate-warning">Warning Error Rate (%)</Label>
                    <Input id="error-rate-warning" type="number" min="0" max="100" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpu-critical">Critical CPU Usage (%)</Label>
                    <Input id="cpu-critical" type="number" min="0" max="100" defaultValue="90" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpu-warning">Warning CPU Usage (%)</Label>
                    <Input id="cpu-warning" type="number" min="0" max="100" defaultValue="75" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memory-critical">Critical Memory Usage (%)</Label>
                    <Input id="memory-critical" type="number" min="0" max="100" defaultValue="90" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memory-warning">Warning Memory Usage (%)</Label>
                    <Input id="memory-warning" type="number" min="0" max="100" defaultValue="75" />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">Email Notifications</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="email-critical">Email for Critical Alerts</Label>
                  <Input
                    id="email-critical"
                    type="email"
                    placeholder="critical@example.com"
                    defaultValue={user?.email || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-warning">Email for Warning Alerts</Label>
                  <Input
                    id="email-warning"
                    type="email"
                    placeholder="alerts@example.com"
                    defaultValue={user?.email || ""}
                  />
                </div>
              </div>

              {/* Save Button */}
              <Button>Save Monitoring Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
