import { users, bypassRules, dnsSettings, logs } from "@shared/schema";
import type { 
  User, InsertUser, 
  BypassRule, InsertBypassRule,
  DnsSettings, InsertDnsSettings,
  Log, InsertLog
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Bypass rules
  getBypassRules(): Promise<BypassRule[]>;
  getBypassRulesByType(type: string): Promise<BypassRule[]>;
  getBypassRule(id: number): Promise<BypassRule | undefined>;
  createBypassRule(rule: InsertBypassRule): Promise<BypassRule>;
  updateBypassRule(id: number, rule: Partial<InsertBypassRule>): Promise<BypassRule | undefined>;
  deleteBypassRule(id: number): Promise<boolean>;
  
  // DNS settings
  getDnsSettings(): Promise<DnsSettings | undefined>;
  updateDnsSettings(settings: Partial<InsertDnsSettings>): Promise<DnsSettings>;
  
  // Logs
  getLogs(limit?: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bypassRules: Map<number, BypassRule>;
  private dnsSettingsData: DnsSettings | undefined;
  private logsData: Log[];
  sessionStore: any; // Using any to bypass type issues
  
  private currentUserId: number;
  private currentBypassRuleId: number;
  private currentLogId: number;

  constructor() {
    this.users = new Map();
    this.bypassRules = new Map();
    this.logsData = [];
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    this.currentUserId = 1;
    this.currentBypassRuleId = 1;
    this.currentLogId = 1;
    
    // Initialize with default DNS settings
    this.dnsSettingsData = {
      id: 1,
      serverName: "DNS Proxy Server",
      upstreamDns: "1.1.1.1",
      port: 53,
      cacheSize: 1000,
      logLevel: "info",
      customConfig: {},
    };
    
    // Add some default rules
    this.createBypassRule({
      type: "website",
      name: "Example Website",
      value: "example.com",
      enabled: true,
    });
    
    this.createBypassRule({
      type: "game",
      name: "Sample Game",
      value: "game-server.example.com",
      enabled: true,
    });
    
    this.createBypassRule({
      type: "ip",
      name: "Example IP",
      value: "192.168.1.100",
      enabled: true,
    });
    
    // Add some sample logs
    this.createLog({
      timestamp: new Date(),
      event: "DNS Proxy Started",
      source: "System",
      status: "Completed",
      details: "DNS Proxy service initialized"
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id, 
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email || "",
      isAdmin: false
    };
    this.users.set(id, user);
    return user;
  }
  
  // Bypass rules
  async getBypassRules(): Promise<BypassRule[]> {
    return Array.from(this.bypassRules.values());
  }
  
  async getBypassRulesByType(type: string): Promise<BypassRule[]> {
    return Array.from(this.bypassRules.values()).filter(rule => rule.type === type);
  }
  
  async getBypassRule(id: number): Promise<BypassRule | undefined> {
    return this.bypassRules.get(id);
  }
  
  async createBypassRule(rule: InsertBypassRule): Promise<BypassRule> {
    const id = this.currentBypassRuleId++;
    const now = new Date();
    const newRule: BypassRule = { 
      id,
      name: rule.name,
      type: rule.type,
      value: rule.value,
      enabled: rule.enabled ?? true,
      createdAt: now
    };
    this.bypassRules.set(id, newRule);
    return newRule;
  }
  
  async updateBypassRule(id: number, rule: Partial<InsertBypassRule>): Promise<BypassRule | undefined> {
    const existingRule = this.bypassRules.get(id);
    if (!existingRule) return undefined;
    
    const updatedRule = { ...existingRule, ...rule };
    this.bypassRules.set(id, updatedRule);
    return updatedRule;
  }
  
  async deleteBypassRule(id: number): Promise<boolean> {
    return this.bypassRules.delete(id);
  }
  
  // DNS settings
  async getDnsSettings(): Promise<DnsSettings | undefined> {
    return this.dnsSettingsData;
  }
  
  async updateDnsSettings(settings: Partial<InsertDnsSettings>): Promise<DnsSettings> {
    if (this.dnsSettingsData) {
      this.dnsSettingsData = { 
        ...this.dnsSettingsData, 
        ...settings,
        // Ensure required fields are set with defaults if not provided
        serverName: settings.serverName || this.dnsSettingsData.serverName,
        upstreamDns: settings.upstreamDns || this.dnsSettingsData.upstreamDns,
        port: settings.port || this.dnsSettingsData.port,
        cacheSize: settings.cacheSize || this.dnsSettingsData.cacheSize,
        logLevel: settings.logLevel || this.dnsSettingsData.logLevel
      };
    } else {
      this.dnsSettingsData = { 
        id: 1, 
        ...settings,
        // Set defaults for required fields
        serverName: settings.serverName || "DNS Proxy Server",
        upstreamDns: settings.upstreamDns || "1.1.1.1",
        port: settings.port || 53,
        cacheSize: settings.cacheSize || 1000,
        logLevel: settings.logLevel || "info",
        customConfig: settings.customConfig || {}
      };
    }
    return this.dnsSettingsData!;
  }
  
  // Logs
  async getLogs(limit: number = 100): Promise<Log[]> {
    // Return most recent logs first
    return this.logsData.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
  }
  
  async createLog(log: InsertLog): Promise<Log> {
    const id = this.currentLogId++;
    const newLog: Log = { 
      id,
      timestamp: log.timestamp || new Date(),
      event: log.event,
      source: log.source,
      status: log.status,
      details: log.details || ""
    };
    this.logsData.push(newLog);
    
    // Keep only the last 1000 logs
    if (this.logsData.length > 1000) {
      this.logsData = this.logsData.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 1000);
    }
    
    return newLog;
  }
}

export const storage = new MemStorage();
