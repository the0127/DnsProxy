import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { StatusCard } from "@/components/dashboard/status-card";
import { TrafficChart } from "@/components/dashboard/traffic-chart";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Server, Network, Filter, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { toast } = useToast();
  
  // Fetch dashboard stats
  const { 
    data: stats,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });
  
  // Restart DNS proxy
  const restartProxy = async () => {
    try {
      await apiRequest("POST", "/api/proxy/restart");
      toast({
        title: "DNS Proxy restarted",
        description: "The DNS proxy service has been restarted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to restart proxy",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  if (isError) {
    return (
      <Layout title="Dashboard">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive mb-6">
          Error loading dashboard: {error?.message || "Unknown error"}
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout 
      title="Dashboard" 
      actions={
        <>
          <div className="flex items-center mr-4">
            <div className={`w-3 h-3 rounded-full ${stats.proxyStatus.running ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
            <span className="text-sm">
              DNS Proxy: {stats.proxyStatus.running ? 'Running' : 'Stopped'}
            </span>
          </div>
          <Button onClick={restartProxy}>
            Restart Service
          </Button>
        </>
      }
    >
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatusCard
          icon={<Server className="text-primary text-2xl" />}
          title="Server Status"
          value={stats.proxyStatus.running ? "Online" : "Offline"}
          footer={stats.proxyStatus.running ? `Uptime: ${Math.floor(stats.proxyStatus.uptime / 3600)} hours` : "Service stopped"}
        />
        
        <StatusCard
          icon={<Network className="text-primary text-2xl" />}
          title="Active Connections"
          value={stats.proxyStatus.connections?.toString() || "0"}
          footer={`Peak today: ${stats.trafficStats.peakConnections}`}
        />
        
        <StatusCard
          icon={<Filter className="text-primary text-2xl" />}
          title="Bypass Rules"
          value={`${stats.ruleStats.active} Active`}
          footer={`${stats.ruleStats.websites} websites, ${stats.ruleStats.games} games, ${stats.ruleStats.ips} IPs`}
        />
        
        <StatusCard
          icon={<Gauge className="text-primary text-2xl" />}
          title="Response Time"
          value={`${stats.trafficStats.averageResponseTime}ms`}
          footer={`24h avg: ${stats.trafficStats.averageResponseTime}ms`}
        />
      </div>

      {/* Traffic Chart */}
      <div className="mb-8">
        <TrafficChart />
      </div>

      {/* Recent Activity */}
      <ActivityTable logs={stats.recentLogs} />
    </Layout>
  );
}
