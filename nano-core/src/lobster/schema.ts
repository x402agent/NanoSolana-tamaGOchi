/**
 * NanoSolana — Lobster Library Agent Schema
 *
 * Defines the JSON schema for Lobster Library agents.
 * Each agent is a specialized Solana intelligence that can be
 * loaded, composed, and deployed in the NanoSolana swarm.
 *
 * Compatible with LobeChat-style agent format for ecosystem interop.
 */

import { z } from "zod";

// ── Zod Schemas ──────────────────────────────────────────────

export const fewShotSchema = z.object({
  content: z.string(),
  role: z.enum(["user", "system", "assistant", "function"]),
});

export const knowledgeBaseSchema = z.object({
  avatar: z.string().nullable(),
  createdAt: z.string().datetime(),
  description: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  id: z.string(),
  isPublic: z.boolean().nullable(),
  name: z.string(),
  settings: z.unknown().optional(),
  type: z.string().nullable(),
  updatedAt: z.string().datetime(),
});

export const agentParamsSchema = z.object({
  frequency_penalty: z.number().default(0),
  max_tokens: z.number().optional(),
  presence_penalty: z.number().default(0),
  temperature: z.number().default(0),
  top_p: z.number().default(1),
}).strict();

export const agentConfigSchema = z.object({
  compressThreshold: z.number().optional(),
  displayMode: z.enum(["chat", "docs"]).optional(),
  enableCompressThreshold: z.boolean().optional(),
  enableHistoryCount: z.boolean().optional(),
  enableMaxTokens: z.boolean().optional(),
  fewShots: z.array(fewShotSchema).optional(),
  historyCount: z.number().optional(),
  inputTemplate: z.string().optional(),
  knowledgeBases: z.array(knowledgeBaseSchema).optional(),
  model: z.string().optional(),
  openingMessage: z.string().optional(),
  openingQuestions: z.array(z.string()).optional(),
  params: agentParamsSchema.optional(),
  plugins: z.array(z.string()).optional(),
  systemRole: z.string(),
}).strict();

export const agentMetaSchema = z.object({
  avatar: z.string(),
  backgroundColor: z.string().optional(),
  category: z.string().optional(),
  description: z.string(),
  tags: z.array(z.string()),
  title: z.string(),
}).strict();

export const lobsterAgentSchema = z.object({
  author: z.string(),
  config: agentConfigSchema,
  createdAt: z.string(),
  examples: z.array(fewShotSchema).optional(),
  homepage: z.string(),
  identifier: z.string(),
  knowledgeCount: z.number(),
  meta: agentMetaSchema,
  pluginCount: z.number(),
  schemaVersion: z.number(),
  summary: z.string().optional(),
  tokenUsage: z.number(),
}).strict();

// ── Types ────────────────────────────────────────────────────

export type FewShot = z.infer<typeof fewShotSchema>;
export type AgentParams = z.infer<typeof agentParamsSchema>;
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type AgentMeta = z.infer<typeof agentMetaSchema>;
export type LobsterAgent = z.infer<typeof lobsterAgentSchema>;

// ── JSON Schema Export ──────────────────────────────────────

/**
 * Get the JSON Schema (Draft-07 compatible) for the agent format.
 */
export function getLobsterAgentJsonSchema(): Record<string, unknown> {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    additionalProperties: false,
    type: "object",
    required: [
      "author", "config", "createdAt", "homepage", "identifier",
      "knowledgeCount", "meta", "pluginCount", "schemaVersion", "tokenUsage",
    ],
    properties: {
      author: { type: "string" },
      config: {
        type: "object",
        required: ["systemRole"],
        additionalProperties: false,
        properties: {
          compressThreshold: { type: "number" },
          displayMode: { type: "string", enum: ["chat", "docs"] },
          enableCompressThreshold: { type: "boolean" },
          enableHistoryCount: { type: "boolean" },
          enableMaxTokens: { type: "boolean" },
          fewShots: {
            type: "array",
            items: {
              type: "object",
              required: ["content", "role"],
              additionalProperties: false,
              properties: {
                content: { type: "string" },
                role: { type: "string", enum: ["user", "system", "assistant", "function"] },
              },
            },
          },
          historyCount: { type: "number" },
          inputTemplate: { type: "string" },
          model: { type: "string" },
          openingMessage: { type: "string" },
          openingQuestions: { type: "array", items: { type: "string" } },
          params: {
            type: "object",
            additionalProperties: false,
            properties: {
              frequency_penalty: { type: "number", default: 0 },
              max_tokens: { type: "number" },
              presence_penalty: { type: "number", default: 0 },
              temperature: { type: "number", default: 0 },
              top_p: { type: "number", default: 1 },
            },
          },
          plugins: { type: "array", items: { type: "string" } },
          systemRole: { type: "string" },
        },
      },
      createdAt: { type: "string" },
      examples: {
        type: "array",
        items: {
          type: "object",
          required: ["content", "role"],
          additionalProperties: false,
          properties: {
            content: { type: "string" },
            role: { type: "string", enum: ["user", "system", "assistant", "function"] },
          },
        },
      },
      homepage: { type: "string" },
      identifier: { type: "string" },
      knowledgeCount: { type: "number" },
      meta: {
        type: "object",
        required: ["avatar", "description", "tags", "title"],
        additionalProperties: false,
        properties: {
          avatar: { type: "string" },
          backgroundColor: { type: "string" },
          category: { type: "string" },
          description: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          title: { type: "string" },
        },
      },
      pluginCount: { type: "number" },
      schemaVersion: { type: "number" },
      summary: { type: "string" },
      tokenUsage: { type: "number" },
    },
  };
}

// ── Solana Categories ────────────────────────────────────────

export const LOBSTER_CATEGORIES = [
  "trading-dex",
  "ml-prediction",
  "defi-yield",
  "technical-analysis",
  "deep-research",
  "risk-management",
  "infrastructure",
  "strategies",
  "macro-regulation",
  "agentic",
] as const;

export type LobsterCategory = typeof LOBSTER_CATEGORIES[number];
