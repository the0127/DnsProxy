import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Log } from "@shared/schema";

export default function Logs() {
  const [limit, setLimit] = useState("100");
  const [filter, setFilter] = useState("");
  
  const { 
    data: logs = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Log[]>({
    queryKey: ["/api/logs", { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/logs?limit=${limit}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });
  
  const filteredLogs = filter
    ? logs.filter(log => 
        log.event.toLowerCase().includes(filter.toLowerCase()) ||
        log.source.toLowerCase().includes(filter.toLowerCase()) ||
        log.status.toLowerCase().includes(filter.toLowerCase())
      )
    : logs;
  
  return (
    <Layout 
      title="System Logs" 
      actions={
        <Button onClick={() => refetch()}>
          Refresh Logs
        </Button>
      }
    >
      <div className="mb-6 bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="filter">Filter</Label>
            <Input
              id="filter"
              placeholder="Filter by event, source or status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="limit">Show entries</Label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger id="limit">
                <SelectValue placeholder="Select limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 entries</SelectItem>
                <SelectItem value="50">50 entries</SelectItem>
                <SelectItem value="100">100 entries</SelectItem>
                <SelectItem value="200">200 entries</SelectItem>
                <SelectItem value="500">500 entries</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive mb-6">
          Error loading logs: {error?.message || "Unknown error"}
        </div>
      ) : (
        <ActivityTable logs={filteredLogs} showViewAll={false} />
      )}
    </Layout>
  );
}
