import { spawn, ChildProcess } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";
import { storage } from "./storage";
import { DnsSettings, BypassRule } from "@shared/schema";

export class DnsProxyManager {
  private process: ChildProcess | null = null;
  private configPath = "/tmp/dnscrypt-proxy.toml";
  private statusCheckInterval: NodeJS.Timeout | null = null;
  private running = false;

  constructor() {
    // Initialize status check
    this.statusCheckInterval = setInterval(() => this.checkStatus(), 30000);
  }

  async start(): Promise<boolean> {
    try {
      if (this.process) {
        await this.stop();
      }

      await this.generateConfig();
      
      this.process = spawn("dnscrypt-proxy", ["-config", this.configPath], {
        detached: false,
        stdio: ["ignore", "pipe", "pipe"]
      });

      if (this.process.stdout) {
        this.process.stdout.on("data", (data) => {
          const message = data.toString();
          storage.createLog({
            timestamp: new Date(),
            event: "DNS Proxy Output",
            source: "dnscrypt-proxy",
            status: "Info",
            details: message
          });
        });
      }

      if (this.process.stderr) {
        this.process.stderr.on("data", (data) => {
          const message = data.toString();
          storage.createLog({
            timestamp: new Date(),
            event: "DNS Proxy Error",
            source: "dnscrypt-proxy",
            status: "Error",
            details: message
          });
        });
      }

      this.process.on("exit", (code) => {
        this.running = false;
        storage.createLog({
          timestamp: new Date(),
          event: "DNS Proxy Stopped",
          source: "System",
          status: code === 0 ? "Completed" : "Error",
          details: `Process exited with code ${code}`
        });
      });

      // Log start event
      storage.createLog({
        timestamp: new Date(),
        event: "DNS Proxy Started",
        source: "System",
        status: "Completed",
        details: "DNS Proxy service started successfully"
      });

      this.running = true;
      return true;
    } catch (error) {
      storage.createLog({
        timestamp: new Date(),
        event: "DNS Proxy Start Failed",
        source: "System",
        status: "Error",
        details: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  async stop(): Promise<boolean> {
    try {
      if (this.process) {
        this.process.kill();
        this.process = null;
      }
      
      this.running = false;
      
      storage.createLog({
        timestamp: new Date(),
        event: "DNS Proxy Stopped",
        source: "System",
        status: "Completed",
        details: "DNS Proxy service stopped manually"
      });
      
      return true;
    } catch (error) {
      storage.createLog({
        timestamp: new Date(),
        event: "DNS Proxy Stop Failed",
        source: "System",
        status: "Error",
        details: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  async restart(): Promise<boolean> {
    try {
      await this.stop();
      return await this.start();
    } catch (error) {
      storage.createLog({
        timestamp: new Date(),
        event: "DNS Proxy Restart Failed",
        source: "System",
        status: "Error",
        details: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  async getStatus(): Promise<{ running: boolean; uptime?: number; connections?: number }> {
    return {
      running: this.running,
      uptime: this.running && this.process ? process.uptime() : 0,
      connections: Math.floor(Math.random() * 100) // Mock data for connections
    };
  }

  private async checkStatus(): Promise<void> {
    if (this.process && this.running) {
      // Check if the process is still running
      if (this.process.exitCode !== null) {
        this.running = false;
        storage.createLog({
          timestamp: new Date(),
          event: "DNS Proxy Stopped Unexpectedly",
          source: "System",
          status: "Error",
          details: `Process exited with code ${this.process.exitCode}`
        });
      }
    }
  }

  private async generateConfig(): Promise<void> {
    try {
      const settings = await storage.getDnsSettings();
      const bypassRules = await storage.getBypassRules();
      
      if (!settings) {
        throw new Error("DNS settings not found");
      }

      const config = this.buildConfigFile(settings, bypassRules);
      await fs.writeFile(this.configPath, config, "utf8");
      
      storage.createLog({
        timestamp: new Date(),
        event: "DNS Proxy Config Generated",
        source: "System",
        status: "Completed",
        details: "Configuration file generated successfully"
      });
    } catch (error) {
      storage.createLog({
        timestamp: new Date(),
        event: "DNS Proxy Config Generation Failed",
        source: "System",
        status: "Error",
        details: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private buildConfigFile(settings: DnsSettings, rules: BypassRule[]): string {
    // Build basic dnscrypt-proxy configuration
    let config = `
# DNS Proxy Configuration
# Generated at ${new Date().toISOString()}

listen_addresses = ['0.0.0.0:${settings.port}']
server_names = ['${settings.upstreamDns}']
max_clients = 250
ipv4_servers = true
ipv6_servers = false
dnscrypt_servers = true
doh_servers = true
require_dnssec = false
require_nolog = true
require_nofilter = true
force_tcp = false
timeout = 5000
keepalive = 30
log_level = ${settings.logLevel}
log_file = '/var/log/dnscrypt-proxy.log'
cert_refresh_delay = 240
fallback_resolvers = ['1.1.1.1:53', '8.8.8.8:53']
ignore_system_dns = true
netprobe_timeout = 60
cache = true
cache_size = ${settings.cacheSize}
cache_min_ttl = 600
cache_max_ttl = 86400
cache_neg_min_ttl = 60
cache_neg_max_ttl = 600

[sources]
  [sources.'public-resolvers']
  urls = ['https://raw.githubusercontent.com/DNSCrypt/dnscrypt-resolvers/master/v3/public-resolvers.md']
  cache_file = '/tmp/public-resolvers.md'
  minisign_key = 'RWQf6LRCGA9i53mlYecO4IzT51TGPpvWucNSCh1CBM0QTaLn73Y7GFO3'
  refresh_delay = 72
  prefix = ''

[static]
`;

    // Add bypass rules
    const enabledRules = rules.filter(rule => rule.enabled);
    
    // Group rules by type
    const websiteRules = enabledRules.filter(rule => rule.type === 'website');
    const gameRules = enabledRules.filter(rule => rule.type === 'game');
    const ipRules = enabledRules.filter(rule => rule.type === 'ip');
    
    // Add forwarding rules
    if (websiteRules.length > 0 || gameRules.length > 0) {
      config += `
[forwarding_rules]
`;
      
      // Add websites and games (both are domains)
      [...websiteRules, ...gameRules].forEach(rule => {
        config += `  '${rule.value}' = '${settings.upstreamDns}'\n`;
      });
    }
    
    // Add IP overrides if needed
    if (ipRules.length > 0) {
      config += `
[cloaking_rules]
`;
      
      ipRules.forEach(rule => {
        config += `  '${rule.name}' = '${rule.value}'\n`;
      });
    }
    
    return config;
  }
}

export const dnsProxyManager = new DnsProxyManager();
