/**
 * NanoSolana — Lobster Library Agent Builder
 *
 * Builds, validates, and exports Lobster Library agents.
 * Handles:
 *   - Schema validation (Zod)
 *   - JSON file I/O
 *   - Token usage estimation
 *   - Agent indexing
 *   - Schema export
 *
 * Based on the LobeChat agent builder pattern, adapted for
 * the Lobster Library format.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { lobsterAgentSchema, getLobsterAgentJsonSchema } from "./schema.js";
import { generateLobsterAgents } from "./generator.js";
import type { LobsterAgent } from "./schema.js";

// ── Token Usage Estimator ────────────────────────────────────

/**
 * Estimate token usage for an agent's system prompt.
 * Rough estimate: ~4 chars per token for English text.
 */
function estimateTokenUsage(agent: LobsterAgent): number {
  let totalChars = agent.config.systemRole.length;

  if (agent.config.openingQuestions) {
    totalChars += agent.config.openingQuestions.join(" ").length;
  }

  if (agent.config.fewShots) {
    totalChars += agent.config.fewShots.reduce((s, f) => s + f.content.length, 0);
  }

  return Math.ceil(totalChars / 4);
}

// ── Agent Builder ────────────────────────────────────────────

interface BuildResult {
  agentId: string;
  success: boolean;
  error?: string;
  tokenUsage?: number;
}

interface BuildSummary {
  totalAgents: number;
  successful: number;
  failed: number;
  totalTokenUsage: number;
  results: BuildResult[];
  durationMs: number;
}

export class LobsterAgentBuilder {
  private outputDir: string;
  private agents: LobsterAgent[] = [];

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    mkdirSync(outputDir, { recursive: true });
  }

  /**
   * Generate all agents and write to disk.
   */
  async build(): Promise<BuildSummary> {
    const startTime = Date.now();
    const results: BuildResult[] = [];

    // Generate all agents
    this.agents = generateLobsterAgents();

    console.log(`\n \u{1F99E} LOBSTER LIBRARY — Agent Builder`);
    console.log("═".repeat(50));
    console.log(` Building ${this.agents.length} specialized Solana agents...\n`);

    for (const agent of this.agents) {
      try {
        // Add token usage estimate
        agent.tokenUsage = estimateTokenUsage(agent);

        // Validate against schema
        const validation = lobsterAgentSchema.safeParse(agent);
        if (!validation.success) {
          results.push({
            agentId: agent.identifier,
            success: false,
            error: validation.error.message,
          });
          console.log(`   \u274C ${agent.identifier}: ${validation.error.message.slice(0, 60)}`);
          continue;
        }

        // Write agent JSON file
        const filePath = resolve(this.outputDir, `${agent.identifier}.json`);
        writeFileSync(filePath, JSON.stringify(agent, null, 2), "utf-8");

        results.push({
          agentId: agent.identifier,
          success: true,
          tokenUsage: agent.tokenUsage,
        });

        console.log(`   \u2705 ${agent.identifier}`);
      } catch (err) {
        results.push({
          agentId: agent.identifier,
          success: false,
          error: (err as Error).message,
        });
        console.log(`   \u274C ${agent.identifier}: ${(err as Error).message}`);
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalTokenUsage = results.reduce((s, r) => s + (r.tokenUsage ?? 0), 0);

    console.log(`\n \u2705 Generated ${successful} agents in ${this.outputDir}`);
    if (failed > 0) console.log(` \u274C ${failed} agents failed`);
    console.log(` \u{1F99E} Lobster Library agents ready!\n`);

    return {
      totalAgents: this.agents.length,
      successful,
      failed,
      totalTokenUsage,
      results,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Build the agent index file.
   */
  buildIndex(): void {
    if (this.agents.length === 0) {
      this.agents = generateLobsterAgents();
    }

    // Collect all tags with frequency
    const tagCounts = new Map<string, number>();
    for (const agent of this.agents) {
      for (const tag of agent.meta.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    // Sort tags by frequency (descending)
    const tags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    const index = {
      schemaVersion: 1,
      agentCount: this.agents.length,
      tags,
      agents: this.agents.map((a) => ({
        identifier: a.identifier,
        title: a.meta.title,
        description: a.meta.description,
        category: a.meta.category,
        tags: a.meta.tags,
        author: a.author,
        tokenUsage: a.tokenUsage,
        createdAt: a.createdAt,
      })),
    };

    const indexPath = resolve(this.outputDir, "index.json");
    writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");
  }

  /**
   * Build the JSON Schema file.
   */
  buildSchema(): void {
    const schemaDir = resolve(this.outputDir, "schema");
    mkdirSync(schemaDir, { recursive: true });

    const schema = getLobsterAgentJsonSchema();
    const schemaPath = resolve(schemaDir, "lobster-agent-schema-v1.json");
    writeFileSync(schemaPath, JSON.stringify(schema, null, 2), "utf-8");
  }

  /**
   * Load an agent from disk.
   */
  static loadAgent(filePath: string): LobsterAgent | null {
    try {
      const raw = readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      const result = lobsterAgentSchema.safeParse(data);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  /**
   * Load all agents from a directory.
   */
  static loadAllAgents(dir: string): LobsterAgent[] {
    if (!existsSync(dir)) return [];

    return readdirSync(dir)
      .filter((f) => f.endsWith(".json") && f !== "index.json")
      .map((f) => LobsterAgentBuilder.loadAgent(resolve(dir, f)))
      .filter((a): a is LobsterAgent => a !== null);
  }

  /**
   * Run the full build pipeline.
   */
  async run(): Promise<BuildSummary> {
    const summary = await this.build();
    this.buildIndex();
    this.buildSchema();
    return summary;
  }
}
