import { useState } from "react";
import { 
  useQuery, 
  useMutation,
  useQueryClient 
} from "@tanstack/react-query";
import { BypassRule } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { 
  MoreVertical, 
  Pencil, 
  Trash2,
  Loader2 
} from "lucide-react";
import { AddRuleModal } from "./add-rule-modal";

type RuleTypeMap = {
  [key: string]: {
    label: string;
    color: string;
  };
};

const ruleTypes: RuleTypeMap = {
  website: {
    label: "Website",
    color: "bg-blue-100 text-blue-800",
  },
  game: {
    label: "Game",
    color: "bg-purple-100 text-purple-800",
  },
  ip: {
    label: "IP",
    color: "bg-orange-100 text-orange-800",
  },
};

type RuleTableProps = {
  type?: "website" | "game" | "ip";
};

export function RuleTable({ type }: RuleTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<BypassRule | null>(null);
  
  const { 
    data: rules = [],
    isLoading,
    isError,
    error
  } = useQuery<BypassRule[]>({
    queryKey: ["/api/bypass-rules", type ? { type } : undefined],
    queryFn: async ({ queryKey }) => {
      let url = "/api/bypass-rules";
      if (type) {
        url += `?type=${type}`;
      }
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch rules");
      return res.json();
    },
  });
  
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      await apiRequest("PATCH", `/api/bypass-rules/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bypass-rules"] });
      toast({
        title: "Rule updated",
        description: "The rule status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update rule",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bypass-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bypass-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Rule deleted",
        description: "The rule has been deleted successfully",
      });
      setRuleToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete rule",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleToggleRule = (id: number, currentValue: boolean) => {
    toggleRuleMutation.mutate({ id, enabled: !currentValue });
  };
  
  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy");
  };
  
  let title = "Bypass Rules";
  let description = "Manage your DNS bypass rules for websites, games, and IP addresses";
  
  if (type) {
    title = `${ruleTypes[type].label} Rules`;
    description = `Manage your DNS bypass rules for ${type}s`;
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button 
              className="mt-4 sm:mt-0"
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-destructive">
              Error loading rules: {error?.message || "Unknown error"}
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rules found. Click "Add Rule" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!type && <TableHead>Type</TableHead>}
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      {!type && (
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${ruleTypes[rule.type].color}`}
                          >
                            {ruleTypes[rule.type].label}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.value}</TableCell>
                      <TableCell>{formatDate(rule.createdAt)}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleRule(rule.id, rule.enabled)}
                          disabled={toggleRuleMutation.isPending}
                          aria-label={`Toggle ${rule.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => handleToggleRule(rule.id, rule.enabled)}
                            >
                              {rule.enabled ? "Disable" : "Enable"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer text-destructive"
                              onClick={() => setRuleToDelete(rule)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AddRuleModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        defaultType={type}
      />
      
      <AlertDialog open={!!ruleToDelete} onOpenChange={() => setRuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the rule "{ruleToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => ruleToDelete && deleteRuleMutation.mutate(ruleToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRuleMutation.isPending}
            >
              {deleteRuleMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
