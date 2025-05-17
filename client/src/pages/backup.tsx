import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, AlertCircle } from "lucide-react";

export default function Backup() {
  const { toast } = useToast();
  const [configData, setConfigData] = useState("");
  const [importConfig, setImportConfig] = useState("");
  const [importError, setImportError] = useState("");
  
  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/export", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to export configuration");
      return res.json();
    },
    onSuccess: (data) => {
      setConfigData(JSON.stringify(data, null, 2));
      toast({
        title: "Export successful",
        description: "Configuration data has been exported successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export configuration",
        variant: "destructive",
      });
    },
  });
  
  const importMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/import", data);
    },
    onSuccess: () => {
      toast({
        title: "Import successful",
        description: "Configuration has been imported successfully",
      });
      setImportConfig("");
      setImportError("");
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import configuration",
        variant: "destructive",
      });
    },
  });
  
  const handleExport = () => {
    exportMutation.mutate();
  };
  
  const handleImport = () => {
    try {
      setImportError("");
      const data = JSON.parse(importConfig);
      importMutation.mutate(data);
    } catch (error) {
      setImportError("Invalid JSON format. Please check your configuration data.");
    }
  };
  
  const downloadConfig = () => {
    if (!configData) {
      toast({
        title: "No data to download",
        description: "Please export the configuration first",
        variant: "destructive",
      });
      return;
    }
    
    const blob = new Blob([configData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dns-proxy-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Layout title="Backup & Restore">
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Configuration</CardTitle>
            <CardDescription>
              Export your DNS proxy configuration for backup or migration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Label htmlFor="exportConfig">Configuration Data</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExport}
                    disabled={exportMutation.isPending}
                  >
                    {exportMutation.isPending ? "Exporting..." : "Generate Export"}
                  </Button>
                </div>
                <Textarea
                  id="exportConfig"
                  value={configData}
                  readOnly
                  className="font-mono text-sm h-64"
                  placeholder="Click 'Generate Export' to view your configuration data..."
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={downloadConfig}
              disabled={!configData}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" /> Download Configuration
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Import Configuration</CardTitle>
            <CardDescription>
              Restore your DNS proxy configuration from a backup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {importError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {importError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="importConfig">Configuration Data</Label>
                <Textarea
                  id="importConfig"
                  value={importConfig}
                  onChange={(e) => setImportConfig(e.target.value)}
                  className="font-mono text-sm h-64"
                  placeholder="Paste your configuration JSON here..."
                />
                <p className="text-sm text-neutral-500">
                  Warning: Importing configuration will overwrite your existing settings
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleImport}
              disabled={!importConfig || importMutation.isPending}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" /> 
              {importMutation.isPending ? "Importing..." : "Import Configuration"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
