/**
 * NanoSolana Docs + Extensions Integration
 *
 * Builds a searchable snapshot of the requested NanoSolana knowledge corpus:
 * - docs/cli
 * - docs/concepts
 * - docs/experiments
 * - docs/gateway
 * - docs/tools
 * - extensions/* (metadata + file counts)
 */

import { existsSync, readdirSync, readFileSync, statSync, type Dirent } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DOC_AREAS = ["cli", "concepts", "experiments", "gateway", "tools"] as const;
const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx"]);
const DEFAULT_CACHE_TTL_MS = 60_000;

export type NanoDocArea = (typeof DOC_AREAS)[number];

export interface NanoDocIndexEntry {
  path: string;
  bytes: number;
  updatedAt: number;
  title?: string;
  summary?: string;
  headings: string[];
}

export interface NanoDocAreaSnapshot {
  area: NanoDocArea;
  path: string;
  files: number;
  markdownFiles: number;
  bytes: number;
  updatedAt: number | null;
  entries: NanoDocIndexEntry[];
}

export interface NanoExtensionIndexEntry {
  id: string;
  name: string;
  description: string;
  directory: string;
  channels: string[];
  hasPersistence: boolean;
  fileCount: number;
  manifestPath?: string;
}

export interface NanoKnowledgeSnapshot {
  generatedAt: number;
  repoRoot: string;
  docs: {
    areas: NanoDocAreaSnapshot[];
    totals: {
      files: number;
      markdownFiles: number;
      bytes: number;
    };
  };
  extensions: {
    directories: number;
    files: number;
    manifests: number;
    entries: NanoExtensionIndexEntry[];
  };
}

export interface NanoKnowledgeSummary {
  generatedAt: number;
  docs: {
    areas: number;
    files: number;
    markdownFiles: number;
    bytes: number;
  };
  extensions: {
    directories: number;
    files: number;
    manifests: number;
  };
}

export interface NanoKnowledgeSearchMatch {
  type: "doc" | "extension";
  id: string;
  path: string;
  title: string;
  subtitle?: string;
  score: number;
}

export interface NanoKnowledgeSnapshotOptions {
  refresh?: boolean;
  cacheTtlMs?: number;
}

let cachedSnapshot: NanoKnowledgeSnapshot | null = null;
let cacheUpdatedAt = 0;

/**
 * Build (or return cached) docs/extensions snapshot.
 */
export function getNanoKnowledgeSnapshot(
  options: NanoKnowledgeSnapshotOptions = {},
): NanoKnowledgeSnapshot {
  const ttlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const now = Date.now();

  if (!options.refresh && cachedSnapshot && now - cacheUpdatedAt <= ttlMs) {
    return cachedSnapshot;
  }

  const snapshot = buildNanoKnowledgeSnapshot();
  cachedSnapshot = snapshot;
  cacheUpdatedAt = now;
  return snapshot;
}

/**
 * Clear in-memory snapshot cache.
 */
export function clearNanoKnowledgeCache(): void {
  cachedSnapshot = null;
  cacheUpdatedAt = 0;
}

/**
 * Generate compact summary for gateway/framework surfaces.
 */
export function getNanoKnowledgeSummary(
  snapshot: NanoKnowledgeSnapshot = getNanoKnowledgeSnapshot(),
): NanoKnowledgeSummary {
  return {
    generatedAt: snapshot.generatedAt,
    docs: {
      areas: snapshot.docs.areas.length,
      files: snapshot.docs.totals.files,
      markdownFiles: snapshot.docs.totals.markdownFiles,
      bytes: snapshot.docs.totals.bytes,
    },
    extensions: {
      directories: snapshot.extensions.directories,
      files: snapshot.extensions.files,
      manifests: snapshot.extensions.manifests,
    },
  };
}

/**
 * Search docs + extension metadata by free-text query.
 */
export function searchNanoKnowledge(
  snapshot: NanoKnowledgeSnapshot,
  query: string,
  limit = 10,
): NanoKnowledgeSearchMatch[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const terms = normalizedQuery.split(/\s+/).filter((token) => token.length > 0);
  const boundedLimit = clamp(limit, 1, 100);
  const matches: NanoKnowledgeSearchMatch[] = [];

  for (const area of snapshot.docs.areas) {
    for (const entry of area.entries) {
      const haystack = [
        entry.path,
        entry.title,
        entry.summary,
        ...entry.headings,
      ]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .join(" ")
        .toLowerCase();

      const score = scoreHaystack(haystack, normalizedQuery, terms);
      if (score <= 0) continue;

      matches.push({
        type: "doc",
        id: entry.path,
        path: entry.path,
        title: entry.title ?? entry.path,
        subtitle: `docs/${area.area}`,
        score,
      });
    }
  }

  for (const extension of snapshot.extensions.entries) {
    const haystack = [
      extension.id,
      extension.name,
      extension.description,
      extension.directory,
      ...extension.channels,
    ]
      .filter((value): value is string => value.length > 0)
      .join(" ")
      .toLowerCase();

    const score = scoreHaystack(haystack, normalizedQuery, terms);
    if (score <= 0) continue;

    matches.push({
      type: "extension",
      id: extension.id,
      path: extension.directory,
      title: extension.name,
      subtitle: extension.description || extension.id,
      score,
    });
  }

  return matches
    .sort((left, right) => right.score - left.score || left.path.localeCompare(right.path))
    .slice(0, boundedLimit);
}

function buildNanoKnowledgeSnapshot(): NanoKnowledgeSnapshot {
  const repoRoot = resolveNanoRepositoryRoot();
  const docAreas = DOC_AREAS.map((area) => scanDocsArea(repoRoot, area));

  const docTotals = docAreas.reduce(
    (totals, area) => ({
      files: totals.files + area.files,
      markdownFiles: totals.markdownFiles + area.markdownFiles,
      bytes: totals.bytes + area.bytes,
    }),
    { files: 0, markdownFiles: 0, bytes: 0 },
  );

  const extensionSnapshot = scanExtensions(repoRoot);

  return {
    generatedAt: Date.now(),
    repoRoot,
    docs: {
      areas: docAreas,
      totals: docTotals,
    },
    extensions: extensionSnapshot,
  };
}

function resolveNanoRepositoryRoot(): string {
  const envRoot = process.env.NANO_REPO_ROOT?.trim();
  const sourceDirectory = dirname(fileURLToPath(import.meta.url));
  const nanoCoreRoot = resolve(sourceDirectory, "../..");
  const cwd = resolve(process.cwd());

  const candidates = [
    envRoot ? resolve(envRoot) : undefined,
    cwd,
    resolve(cwd, ".."),
    resolve(nanoCoreRoot, ".."),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (hasKnowledgeCorpus(candidate)) return candidate;
  }

  return resolve(nanoCoreRoot, "..");
}

function hasKnowledgeCorpus(rootPath: string): boolean {
  return existsSync(join(rootPath, "docs", "cli")) && existsSync(join(rootPath, "extensions"));
}

function scanDocsArea(repoRoot: string, area: NanoDocArea): NanoDocAreaSnapshot {
  const areaDirectory = join(repoRoot, "docs", area);
  const files = walkFiles(areaDirectory);

  let fileCount = 0;
  let markdownCount = 0;
  let bytes = 0;
  let latestUpdatedAt: number | null = null;
  const entries: NanoDocIndexEntry[] = [];

  for (const filePath of files) {
    const stat = safeStat(filePath);
    if (!stat) continue;

    fileCount += 1;
    bytes += stat.size;
    latestUpdatedAt = latestUpdatedAt === null ? stat.mtimeMs : Math.max(latestUpdatedAt, stat.mtimeMs);

    if (!isMarkdownFile(filePath)) continue;

    markdownCount += 1;
    const content = safeReadFile(filePath);
    const metadata = extractMarkdownMetadata(content);

    entries.push({
      path: toRepoRelative(repoRoot, filePath),
      bytes: stat.size,
      updatedAt: stat.mtimeMs,
      title: metadata.title,
      summary: metadata.summary,
      headings: metadata.headings,
    });
  }

  entries.sort((left, right) => left.path.localeCompare(right.path));

  return {
    area,
    path: `docs/${area}`,
    files: fileCount,
    markdownFiles: markdownCount,
    bytes,
    updatedAt: latestUpdatedAt,
    entries,
  };
}

function scanExtensions(repoRoot: string): NanoKnowledgeSnapshot["extensions"] {
  const extensionRoot = join(repoRoot, "extensions");
  if (!existsSync(extensionRoot)) {
    return {
      directories: 0,
      files: 0,
      manifests: 0,
      entries: [],
    };
  }

  const extensionDirectories = safeReadDirectory(extensionRoot)
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(extensionRoot, entry.name))
    .sort((left, right) => left.localeCompare(right));

  let totalFiles = 0;
  let manifestCount = 0;
  const entries: NanoExtensionIndexEntry[] = [];

  for (const directoryPath of extensionDirectories) {
    const files = walkFiles(directoryPath);
    const fileCount = files.length;
    totalFiles += fileCount;

    const manifestPath = join(directoryPath, "nanosolana-plugin.json");
    const packagePath = join(directoryPath, "package.json");

    const manifest = readJsonObject(manifestPath);
    const packageJson = readJsonObject(packagePath);

    if (manifest) {
      manifestCount += 1;
    }

    const extensionId = getStringField(manifest, "id")
      ?? getStringField(packageJson, "name")
      ?? basename(directoryPath);

    const extensionName = getStringField(manifest, "name")
      ?? getStringField(packageJson, "name")
      ?? extensionId;

    const extensionDescription = getStringField(manifest, "description")
      ?? getStringField(packageJson, "description")
      ?? "";

    const channels = getStringArrayField(manifest, "channels");
    const persistence = manifest?.["persistence"];

    entries.push({
      id: extensionId,
      name: extensionName,
      description: extensionDescription,
      directory: toRepoRelative(repoRoot, directoryPath),
      channels,
      hasPersistence: isRecord(persistence),
      fileCount,
      manifestPath: manifest ? toRepoRelative(repoRoot, manifestPath) : undefined,
    });
  }

  entries.sort((left, right) => left.id.localeCompare(right.id));

  return {
    directories: extensionDirectories.length,
    files: totalFiles,
    manifests: manifestCount,
    entries,
  };
}

function walkFiles(rootPath: string): string[] {
  if (!existsSync(rootPath)) return [];

  const files: string[] = [];
  const queue: string[] = [rootPath];

  while (queue.length > 0) {
    const currentPath = queue.pop();
    if (!currentPath) continue;

    for (const entry of safeReadDirectory(currentPath)) {
      const fullPath = join(currentPath, entry.name);

      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  files.sort((left, right) => left.localeCompare(right));
  return files;
}

function safeReadDirectory(path: string): Dirent[] {
  try {
    return readdirSync(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

function safeReadFile(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function safeStat(path: string): { size: number; mtimeMs: number } | null {
  try {
    const stat = statSync(path);
    return { size: stat.size, mtimeMs: stat.mtimeMs };
  } catch {
    return null;
  }
}

function readJsonObject(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;

  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    if (isRecord(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStringField(record: Record<string, unknown> | null, key: string): string | undefined {
  if (!record) return undefined;
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function getStringArrayField(record: Record<string, unknown> | null, key: string): string[] {
  if (!record) return [];
  const value = record[key];
  if (!Array.isArray(value)) return [];

  return value.filter((entry): entry is string => typeof entry === "string");
}

function isMarkdownFile(path: string): boolean {
  return MARKDOWN_EXTENSIONS.has(extname(path).toLowerCase());
}

function extractMarkdownMetadata(markdown: string): {
  title?: string;
  summary?: string;
  headings: string[];
} {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const frontmatter = parseFrontmatter(normalized);
  const headings = normalized
    .split("\n")
    .filter((line) => /^#{1,3}\s+\S/.test(line))
    .map((line) => line.replace(/^#{1,3}\s+/, "").trim())
    .slice(0, 3);

  const title = frontmatter["title"] ?? headings[0];
  const summary = frontmatter["summary"];

  return { title, summary, headings };
}

function parseFrontmatter(markdown: string): Record<string, string> {
  if (!markdown.startsWith("---\n")) return {};

  const endIndex = markdown.indexOf("\n---\n", 4);
  if (endIndex < 0) return {};

  const body = markdown.slice(4, endIndex);
  const parsed: Record<string, string> = {};

  for (const line of body.split("\n")) {
    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.+)$/.exec(line.trim());
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function scoreHaystack(haystack: string, phrase: string, terms: string[]): number {
  if (!haystack.length) return 0;

  let score = 0;
  if (haystack.includes(phrase)) {
    score += phrase.length * 8;
  }

  for (const term of terms) {
    if (haystack.includes(term)) {
      score += term.length * 2;
    }
  }

  return score;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toRepoRelative(repoRoot: string, targetPath: string): string {
  return relative(repoRoot, targetPath).replaceAll("\\", "/");
}
