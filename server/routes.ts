import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { dnsProxyManager } from "./proxy";
import { z } from "zod";

// Add this to ignore type checking errors from external modules
// @ts-ignore
import { 
  insertBypassRuleSchema, 
  insertDnsSettingsSchema,
  insertLogSchema
} from "@shared/schema";

// Auth middleware
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // DNS Proxy Status and Control
  app.get("/api/proxy/status", requireAuth, async (req, res) => {
    const status = await dnsProxyManager.getStatus();
    res.json(status);
  });

  app.post("/api/proxy/start", requireAuth, async (req, res) => {
    const success = await dnsProxyManager.start();
    if (success) {
      res.json({ message: "DNS Proxy started successfully" });
    } else {
      res.status(500).json({ message: "Failed to start DNS Proxy" });
    }
  });

  app.post("/api/proxy/stop", requireAuth, async (req, res) => {
    const success = await dnsProxyManager.stop();
    if (success) {
      res.json({ message: "DNS Proxy stopped successfully" });
    } else {
      res.status(500).json({ message: "Failed to stop DNS Proxy" });
    }
  });

  app.post("/api/proxy/restart", requireAuth, async (req, res) => {
    const success = await dnsProxyManager.restart();
    if (success) {
      res.json({ message: "DNS Proxy restarted successfully" });
    } else {
      res.status(500).json({ message: "Failed to restart DNS Proxy" });
    }
  });

  // Bypass Rules
  app.get("/api/bypass-rules", requireAuth, async (req, res) => {
    const { type } = req.query;
    let rules;
    
    if (type && typeof type === "string") {
      rules = await storage.getBypassRulesByType(type);
    } else {
      rules = await storage.getBypassRules();
    }
    
    res.json(rules);
  });

  app.get("/api/bypass-rules/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    const rule = await storage.getBypassRule(id);
    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }
    
    res.json(rule);
  });

  app.post("/api/bypass-rules", requireAuth, async (req, res) => {
    try {
      const validatedData = insertBypassRuleSchema.parse(req.body);
      const rule = await storage.createBypassRule(validatedData);
      
      // Log the event
      await storage.createLog({
        timestamp: new Date(),
        event: "Bypass Rule Added",
        source: `User: ${req.user?.username}`,
        status: "Completed",
        details: `Added ${validatedData.type} rule: ${validatedData.name}`
      });
      
      // Restart proxy to apply changes
      await dnsProxyManager.restart();
      
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create rule" });
    }
  });

  app.patch("/api/bypass-rules/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertBypassRuleSchema.partial().parse(req.body);
      const updatedRule = await storage.updateBypassRule(id, validatedData);
      
      if (!updatedRule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      // Log the event
      await storage.createLog({
        timestamp: new Date(),
        event: "Bypass Rule Updated",
        source: `User: ${req.user?.username}`,
        status: "Completed",
        details: `Updated rule: ${updatedRule.name}`
      });
      
      // Restart proxy to apply changes
      await dnsProxyManager.restart();
      
      res.json(updatedRule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update rule" });
    }
  });

  app.delete("/api/bypass-rules/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const rule = await storage.getBypassRule(id);
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      const deleted = await storage.deleteBypassRule(id);
      
      if (deleted) {
        // Log the event
        await storage.createLog({
          timestamp: new Date(),
          event: "Bypass Rule Deleted",
          source: `User: ${req.user?.username}`,
          status: "Completed",
          details: `Deleted rule: ${rule.name}`
        });
        
        // Restart proxy to apply changes
        await dnsProxyManager.restart();
        
        res.json({ message: "Rule deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete rule" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete rule" });
    }
  });

  // DNS Settings
  app.get("/api/dns-settings", requireAuth, async (req, res) => {
    const settings = await storage.getDnsSettings();
    res.json(settings);
  });

  app.patch("/api/dns-settings", requireAuth, async (req, res) => {
    try {
      // Make sure we don't have undefined values for required fields
      const validatedData = insertDnsSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateDnsSettings(validatedData);
      
      // Log the event
      await storage.createLog({
        timestamp: new Date(),
        event: "DNS Settings Updated",
        source: `User: ${req.user?.username}`,
        status: "Completed",
        details: "Updated DNS server settings"
      });
      
      // Restart proxy to apply changes
      await dnsProxyManager.restart();
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Logs
  app.get("/api/logs", requireAuth, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = await storage.getLogs(limit);
    res.json(logs);
  });

  // Export configuration
  app.get("/api/export", requireAuth, async (req, res) => {
    try {
      const rules = await storage.getBypassRules();
      const settings = await storage.getDnsSettings();
      
      const exportData = {
        rules,
        settings,
        exportDate: new Date().toISOString()
      };
      
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export configuration" });
    }
  });

  // Import configuration
  app.post("/api/import", requireAuth, async (req, res) => {
    try {
      const { rules, settings } = req.body;
      
      if (settings) {
        await storage.updateDnsSettings(settings);
      }
      
      if (rules && Array.isArray(rules)) {
        // Clear existing rules
        const existingRules = await storage.getBypassRules();
        for (const rule of existingRules) {
          await storage.deleteBypassRule(rule.id);
        }
        
        // Add new rules
        for (const rule of rules) {
          await storage.createBypassRule(rule);
        }
      }
      
      // Log the event
      await storage.createLog({
        timestamp: new Date(),
        event: "Configuration Imported",
        source: `User: ${req.user?.username}`,
        status: "Completed",
        details: "Imported configuration data"
      });
      
      // Restart proxy to apply changes
      await dnsProxyManager.restart();
      
      res.json({ message: "Configuration imported successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to import configuration" });
    }
  });

  // Backend stats for the dashboard
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const proxyStatus = await dnsProxyManager.getStatus();
      const rules = await storage.getBypassRules();
      const logs = await storage.getLogs(5);
      
      // Count rules by type
      const websiteCount = rules.filter(r => r.type === "website").length;
      const gameCount = rules.filter(r => r.type === "game").length;
      const ipCount = rules.filter(r => r.type === "ip").length;
      
      res.json({
        proxyStatus,
        ruleStats: {
          total: rules.length,
          active: rules.filter(r => r.enabled).length,
          websites: websiteCount,
          games: gameCount,
          ips: ipCount
        },
        recentLogs: logs,
        // Mock data for traffic stats since we can't measure this easily
        trafficStats: {
          requestsToday: Math.floor(Math.random() * 1000) + 500,
          requestsYesterday: Math.floor(Math.random() * 1000) + 500,
          averageResponseTime: Math.floor(Math.random() * 100) + 20,
          peakConnections: Math.floor(Math.random() * 200) + 50,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
