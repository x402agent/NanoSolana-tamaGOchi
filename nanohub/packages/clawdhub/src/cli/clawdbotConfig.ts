import { readFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import JSON5 from 'json5'
import { resolveHome } from '../homedir.js'

type TamaGObotConfig = {
  agent?: { workspace?: string }
  agents?: {
    defaults?: { workspace?: string }
    list?: Array<{
      id?: string
      name?: string
      workspace?: string
      default?: boolean
    }>
  }
  routing?: {
    agents?: Record<
      string,
      {
        name?: string
        workspace?: string
      }
    >
  }
  skills?: {
    load?: {
      extraDirs?: string[]
    }
  }
}

export type TamaGObotSkillRoots = {
  roots: string[]
  labels: Record<string, string>
}

export async function resolveTamaGObotSkillRoots(): Promise<TamaGObotSkillRoots> {
  const roots: string[] = []
  const labels: Record<string, string> = {}

  const tamagobotStateDir = resolveTamaGObotStateDir()
  const sharedSkills = resolveUserPath(join(tamagobotStateDir, 'skills'))
  pushRoot(roots, labels, sharedSkills, 'Shared skills')

  const nanosolanaStateDir = resolveNanoSolanaStateDir()
  const nanosolanaShared = resolveUserPath(join(nanosolanaStateDir, 'skills'))
  pushRoot(roots, labels, nanosolanaShared, 'NanoSolana: Shared skills')

  const [tamagobotConfig, nanosolanaConfig] = await Promise.all([
    readTamaGObotConfig(),
    readNanoSolanaConfig(),
  ])
  if (!tamagobotConfig && !nanosolanaConfig) return { roots, labels }

  if (tamagobotConfig) {
    addConfigRoots(tamagobotConfig, roots, labels)
  }
  if (nanosolanaConfig) {
    addConfigRoots(nanosolanaConfig, roots, labels, 'NanoSolana')
  }

  return { roots, labels }
}

export async function resolveTamaGObotDefaultWorkspace(): Promise<string | null> {
  const config = await readTamaGObotConfig()
  const nanosolanaConfig = await readNanoSolanaConfig()
  if (!config && !nanosolanaConfig) return null

  const defaultsWorkspace = resolveUserPath(
    config?.agents?.defaults?.workspace ?? config?.agent?.workspace ?? '',
  )
  if (defaultsWorkspace) return defaultsWorkspace

  const listedAgents = config?.agents?.list ?? []
  const defaultAgent =
    listedAgents.find((entry) => entry.default) ?? listedAgents.find((entry) => entry.id === 'main')
  const listWorkspace = resolveUserPath(defaultAgent?.workspace ?? '')
  if (listWorkspace) return listWorkspace

  if (!nanosolanaConfig) return null
  const nanosolanaDefaults = resolveUserPath(
    nanosolanaConfig.agents?.defaults?.workspace ?? nanosolanaConfig.agent?.workspace ?? '',
  )
  if (nanosolanaDefaults) return nanosolanaDefaults
  const nanosolanaAgents = nanosolanaConfig.agents?.list ?? []
  const nanosolanaDefaultAgent =
    nanosolanaAgents.find((entry) => entry.default) ??
    nanosolanaAgents.find((entry) => entry.id === 'main')
  const nanosolanaWorkspace = resolveUserPath(nanosolanaDefaultAgent?.workspace ?? '')
  return nanosolanaWorkspace || null
}

function resolveTamaGObotStateDir() {
  const override = process.env.TAMAGOBOT_STATE_DIR?.trim()
  if (override) return resolveUserPath(override)
  return join(resolveHome(), '.tamagobot')
}

function resolveTamaGObotConfigPath() {
  const override = process.env.TAMAGOBOT_CONFIG_PATH?.trim()
  if (override) return resolveUserPath(override)
  return join(resolveTamaGObotStateDir(), 'tamagobot.json')
}

function resolveNanoSolanaStateDir() {
  const override = process.env.NANOSOLANA_STATE_DIR?.trim()
  if (override) return resolveUserPath(override)
  return join(resolveHome(), '.nanosolana')
}

function resolveNanoSolanaConfigPath() {
  const override = process.env.NANOSOLANA_CONFIG_PATH?.trim()
  if (override) return resolveUserPath(override)
  return join(resolveNanoSolanaStateDir(), 'nanosolana.json')
}

function resolveUserPath(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('~')) {
    return resolve(trimmed.replace(/^~(?=$|[\\/])/, resolveHome()))
  }
  return resolve(trimmed)
}

async function readTamaGObotConfig(): Promise<TamaGObotConfig | null> {
  return readConfigFile(resolveTamaGObotConfigPath())
}

async function readNanoSolanaConfig(): Promise<TamaGObotConfig | null> {
  return readConfigFile(resolveNanoSolanaConfigPath())
}

async function readConfigFile(path: string): Promise<TamaGObotConfig | null> {
  try {
    const raw = await readFile(path, 'utf8')
    const parsed = JSON5.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as TamaGObotConfig
  } catch {
    return null
  }
}

function addConfigRoots(
  config: TamaGObotConfig,
  roots: string[],
  labels: Record<string, string>,
  labelPrefix?: string,
) {
  const prefix = labelPrefix ? `${labelPrefix}: ` : ''

  const mainWorkspace = resolveUserPath(
    config.agents?.defaults?.workspace ?? config.agent?.workspace ?? '',
  )
  if (mainWorkspace) {
    pushRoot(roots, labels, join(mainWorkspace, 'skills'), `${prefix}Agent: main`)
  }

  const listedAgents = config.agents?.list ?? []
  for (const entry of listedAgents) {
    const workspace = resolveUserPath(entry?.workspace ?? '')
    if (!workspace) continue
    const name = entry?.name?.trim() || entry?.id?.trim() || 'agent'
    pushRoot(roots, labels, join(workspace, 'skills'), `${prefix}Agent: ${name}`)
  }

  const agents = config.routing?.agents ?? {}
  for (const [agentId, entry] of Object.entries(agents)) {
    const workspace = resolveUserPath(entry?.workspace ?? '')
    if (!workspace) continue
    const name = entry?.name?.trim() || agentId
    pushRoot(roots, labels, join(workspace, 'skills'), `${prefix}Agent: ${name}`)
  }

  const extraDirs = config.skills?.load?.extraDirs ?? []
  for (const dir of extraDirs) {
    const resolved = resolveUserPath(String(dir))
    if (!resolved) continue
    const label = `${prefix}Extra: ${basename(resolved) || resolved}`
    pushRoot(roots, labels, resolved, label)
  }
}

function pushRoot(roots: string[], labels: Record<string, string>, root: string, label?: string) {
  const resolved = resolveUserPath(root)
  if (!resolved) return
  if (!roots.includes(resolved)) roots.push(resolved)
  if (!label) return
  const existing = labels[resolved]
  if (!existing) {
    labels[resolved] = label
    return
  }
  const parts = existing
    .split(', ')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.includes(label)) return
  labels[resolved] = `${existing}, ${label}`
}
