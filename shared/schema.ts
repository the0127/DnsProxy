import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address").optional(),
});

export const bypassRules = pgTable("bypass_rules", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // website, game, ip
  name: text("name").notNull(),
  value: text("value").notNull(), // domain, IP, or identifier
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBypassRuleSchema = z.object({
  type: z.string(),
  name: z.string(),
  value: z.string(),
  enabled: z.boolean().default(true),
});

export const dnsSettings = pgTable("dns_settings", {
  id: serial("id").primaryKey(),
  serverName: text("server_name").notNull(),
  upstreamDns: text("upstream_dns").notNull(), // DNS resolver to use
  port: integer("port").default(53).notNull(),
  cacheSize: integer("cache_size").default(1000).notNull(),
  logLevel: text("log_level").default("info").notNull(),
  customConfig: jsonb("custom_config"), // Additional config options
});

export const insertDnsSettingsSchema = z.object({
  serverName: z.string(),
  upstreamDns: z.string(),
  port: z.number().default(53),
  cacheSize: z.number().default(1000),
  logLevel: z.enum(["info", "debug", "warning", "error"]).default("info"),
  customConfig: z.record(z.any()).optional(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  event: text("event").notNull(),
  source: text("source").notNull(),
  status: text("status").notNull(),
  details: text("details"),
});

export const insertLogSchema = z.object({
  timestamp: z.date().default(() => new Date()),
  event: z.string(),
  source: z.string(),
  status: z.string(),
  details: z.string().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBypassRule = z.infer<typeof insertBypassRuleSchema>;
export type BypassRule = typeof bypassRules.$inferSelect;

export type InsertDnsSettings = z.infer<typeof insertDnsSettingsSchema>;
export type DnsSettings = typeof dnsSettings.$inferSelect;

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;
