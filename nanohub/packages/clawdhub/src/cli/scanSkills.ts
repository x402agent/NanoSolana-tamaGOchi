import { readdir, stat } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { resolveHome } from '../homedir.js'
import { sanitizeSlug, titleCase } from './slug.js'

export type SkillFolder = {
  folder: string
  slug: string
  displayName: string
}

export async function findSkillFolders(root: string): Promise<SkillFolder[]> {
  const absRoot = resolve(root)
  const rootStat = await stat(absRoot).catch(() => null)
  if (!rootStat || !rootStat.isDirectory()) return []

  const direct = await isSkillFolder(absRoot)
  if (direct) return [direct]

  const entries = await readdir(absRoot, { withFileTypes: true }).catch(() => [])
  const folders = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(absRoot, entry.name))
  const results: SkillFolder[] = []
  for (const folder of folders) {
    const found = await isSkillFolder(folder)
    if (found) results.push(found)
  }
  return results.sort((a, b) => a.slug.localeCompare(b.slug))
}

export function getFallbackSkillRoots(workdir: string) {
  const home = resolveHome()
  const roots = [
    // adjacent repo installs
    resolve(workdir, '..', 'clawdis', 'skills'),
    resolve(workdir, '..', 'clawdis', 'Skills'),
    resolve(workdir, '..', 'tamagobot', 'skills'),
    resolve(workdir, '..', 'tamagobot', 'Skills'),
    resolve(workdir, '..', 'nanosolana', 'skills'),
    resolve(workdir, '..', 'nanosolana', 'Skills'),
    resolve(workdir, '..', 'tamagobot', 'skills'),
    resolve(workdir, '..', 'tamagobot', 'Skills'),

    // legacy locations
    resolve(home, 'clawd', 'skills'),
    resolve(home, 'clawd', 'Skills'),
    resolve(home, '.clawd', 'skills'),
    resolve(home, '.clawd', 'Skills'),

    resolve(home, 'tamagobot', 'skills'),
    resolve(home, 'tamagobot', 'Skills'),
    resolve(home, '.tamagobot', 'skills'),
    resolve(home, '.tamagobot', 'Skills'),

    resolve(home, 'clawdis', 'skills'),
    resolve(home, 'clawdis', 'Skills'),
    resolve(home, '.clawdis', 'skills'),
    resolve(home, '.clawdis', 'Skills'),

    resolve(home, 'nanosolana', 'skills'),
    resolve(home, 'nanosolana', 'Skills'),
    resolve(home, '.nanosolana', 'skills'),
    resolve(home, '.nanosolana', 'Skills'),

    resolve(home, 'tamagobot', 'skills'),
    resolve(home, 'tamagobot', 'Skills'),
    resolve(home, '.tamagobot', 'skills'),
    resolve(home, '.tamagobot', 'Skills'),

    // macOS App Support legacy
    resolve(home, 'Library', 'Application Support', 'tamagobot', 'skills'),
    resolve(home, 'Library', 'Application Support', 'tamagobot', 'Skills'),
    resolve(home, 'Library', 'Application Support', 'clawdis', 'skills'),
    resolve(home, 'Library', 'Application Support', 'clawdis', 'Skills'),
    resolve(home, 'Library', 'Application Support', 'nanosolana', 'skills'),
    resolve(home, 'Library', 'Application Support', 'nanosolana', 'Skills'),
    resolve(home, 'Library', 'Application Support', 'tamagobot', 'skills'),
    resolve(home, 'Library', 'Application Support', 'tamagobot', 'Skills'),
  ]
  return Array.from(new Set(roots))
}

async function isSkillFolder(folder: string): Promise<SkillFolder | null> {
  const marker = await findSkillMarker(folder)
  if (!marker) return null
  const base = basename(folder)
  const slug = sanitizeSlug(base)
  if (!slug) return null
  const displayName = titleCase(base)
  return { folder, slug, displayName }
}

async function findSkillMarker(folder: string) {
  const candidates = ['SKILL.md', 'skill.md']
  for (const name of candidates) {
    const path = join(folder, name)
    const st = await stat(path).catch(() => null)
    if (st?.isFile()) return path
  }
  return null
}
