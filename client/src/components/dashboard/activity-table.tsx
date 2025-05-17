import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link } from "wouter";
import { Log } from "@shared/schema";

type ActivityTableProps = {
  logs: Log[];
  showViewAll?: boolean;
};

export function ActivityTable({ logs, showViewAll = true }: ActivityTableProps) {
  const getStatusBadge = (status: string) => {
    let variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | null
      | undefined;
    
    switch (status.toLowerCase()) {
      case "completed":
        variant = "default";
        break;
      case "resolved":
      case "bypassed":
        variant = "default";
        break;
      case "cached":
        variant = "secondary";
        break;
      case "error":
        variant = "destructive";
        break;
      default:
        variant = "outline";
    }
    
    return (
      <Badge variant={variant} className="capitalize">
        {status}
      </Badge>
    );
  };
  
  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return format(date, "yyyy-MM-dd HH:mm:ss");
  };
  
  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-neutral-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-neutral-700">Recent Activity</CardTitle>
          {showViewAll && (
            <Link href="/logs" className="text-primary hover:underline text-sm">
              View All Logs
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-neutral-100">
              <TableRow>
                <TableHead className="py-3 text-neutral-500">Timestamp</TableHead>
                <TableHead className="py-3 text-neutral-500">Event</TableHead>
                <TableHead className="py-3 text-neutral-500">Source</TableHead>
                <TableHead className="py-3 text-neutral-500">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="py-4 text-sm">{formatTimestamp(log.timestamp)}</TableCell>
                    <TableCell className="py-4 text-sm">{log.event}</TableCell>
                    <TableCell className="py-4 text-sm">{log.source}</TableCell>
                    <TableCell className="py-4">
                      {getStatusBadge(log.status)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-neutral-500">
                    No recent activity logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
