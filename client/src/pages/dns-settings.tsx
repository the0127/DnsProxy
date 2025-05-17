import { useState } from "react";
import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Layout } from "@/components/layout/layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertDnsSettingsSchema, DnsSettings as DnsSettingsType } from "@shared/schema";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = insertDnsSettingsSchema.partial().extend({
  serverName: z.string().min(1, "Server name is required"),
  upstreamDns: z.string().min(1, "Upstream DNS is required"),
  port: z.coerce.number().int().min(1, "Port must be a positive number").max(65535, "Port must be less than 65536"),
  cacheSize: z.coerce.number().int().min(10, "Cache size must be at least 10"),
  logLevel: z.enum(["debug", "info", "warning", "error"]),
});

type FormData = z.infer<typeof formSchema>;

export default function DnsSettings() {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { 
    data,
    isLoading,
    isError,
    error
  } = useQuery<DnsSettingsType>({
    queryKey: ["/api/dns-settings"],
    queryFn: async () => {
      const res = await fetch("/api/dns-settings", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch DNS settings");
      return res.json();
    },
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serverName: "",
      upstreamDns: "",
      port: 53,
      cacheSize: 1000,
      logLevel: "info",
    },
  });
  
  // Update form when data is loaded
  React.useEffect(() => {
    if (data) {
      form.reset({
        serverName: data.serverName,
        upstreamDns: data.upstreamDns,
        port: data.port,
        cacheSize: data.cacheSize,
        logLevel: data.logLevel,
      });
    }
  }, [data, form]);
  
  const updateSettingsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest("PATCH", "/api/dns-settings", formData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "DNS settings have been updated successfully.",
      });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 5000);
      queryClient.invalidateQueries({ queryKey: ["/api/dns-settings"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "An error occurred while updating settings",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (formData: FormData) => {
    updateSettingsMutation.mutate(formData);
  };
  
  if (isLoading) {
    return (
      <Layout title="DNS Settings">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="DNS Settings">
      {isError && (
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load DNS settings: {error?.message || "Unknown error"}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {isSuccess && (
        <div className="mb-6">
          <Alert className="bg-green-50 border-green-500 text-green-800">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              DNS settings have been updated successfully. The proxy service has been restarted with the new settings.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>DNS Server Configuration</CardTitle>
          <CardDescription>
            Configure the DNS proxy server settings. Changes will require a service restart.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="serverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server Name</FormLabel>
                      <FormControl>
                        <Input placeholder="DNS Proxy Server" {...field} />
                      </FormControl>
                      <FormDescription>
                        A name to identify this DNS server
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="upstreamDns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upstream DNS</FormLabel>
                      <FormControl>
                        <Input placeholder="1.1.1.1" {...field} />
                      </FormControl>
                      <FormDescription>
                        The DNS resolver to forward requests to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listen Port</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="53" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Port on which the DNS proxy will listen (default: 53)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cacheSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cache Size</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1000" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of DNS entries to cache
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="logLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Log Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select log level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Level of detail for DNS proxy logs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <CardFooter className="px-0 pt-4">
                <Button 
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </Layout>
  );
}
