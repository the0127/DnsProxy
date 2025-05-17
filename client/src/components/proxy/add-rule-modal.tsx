import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertBypassRuleSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = insertBypassRuleSchema.extend({
  type: z.enum(["website", "game", "ip"], {
    required_error: "Please select a rule type",
  }),
});

type FormData = z.infer<typeof formSchema>;

type AddRuleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "website" | "game" | "ip";
};

export function AddRuleModal({ isOpen, onClose, defaultType }: AddRuleModalProps) {
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: defaultType || "website",
      name: "",
      value: "",
      enabled: true,
    },
  });
  
  const addRuleMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/bypass-rules", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Rule added",
        description: "The bypass rule has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bypass-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      form.reset({
        type: defaultType || "website",
        name: "",
        value: "",
        enabled: true,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to add rule",
        description: error.message || "An error occurred while adding the rule",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormData) => {
    addRuleMutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Bypass Rule</DialogTitle>
          <DialogDescription>
            Create a new bypass rule for websites, games, or IP addresses.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a rule type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="game">Game</SelectItem>
                      <SelectItem value="ip">IP Address</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of resource you want to bypass
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={
                        form.watch("type") === "website"
                          ? "Example Website"
                          : form.watch("type") === "game"
                          ? "Game Name"
                          : "IP Label"
                      } 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this rule
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={
                        form.watch("type") === "website" || form.watch("type") === "game"
                          ? "example.com"
                          : "192.168.1.100"
                      } 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    {form.watch("type") === "website" || form.watch("type") === "game"
                      ? "The domain name to bypass"
                      : "The IP address to bypass"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable rule immediately</FormLabel>
                    <FormDescription>
                      If checked, this rule will be active as soon as it's created
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={addRuleMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={addRuleMutation.isPending}
              >
                {addRuleMutation.isPending ? "Adding..." : "Add Rule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
