export type SiteMode = 'skills' | 'souls'

const DEFAULT_NANOHUB_SITE_URL = 'https://hub.nanosolana.com'
const DEFAULT_DOCS_SITE_URL = 'https://docs.nanosolana.com'
const DEFAULT_DOCS_HOST = 'docs.nanosolana.com'
const LEGACY_HOSTS = new Set([
  'nanohub.com',
  'www.nanohub.com',
  'auth.nanohub.com',
  'clawhub.com',
  'www.clawhub.com',
  'auth.clawhub.com',
  'clawhub.ai',
  'www.clawhub.ai',
  'auth.clawhub.ai',
  'onlycrabs.ai',
  'www.onlycrabs.ai',
])

function readMetaEnv(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function normalizeNanoHubSiteOrigin(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (LEGACY_HOSTS.has(url.hostname.toLowerCase())) {
      return DEFAULT_NANOHUB_SITE_URL
    }
    return url.origin
  } catch {
    return null
  }
}

// Legacy alias
export const normalizeClawHubSiteOrigin = normalizeNanoHubSiteOrigin

export function getNanoHubSiteUrl() {
  return normalizeNanoHubSiteOrigin(readMetaEnv(import.meta.env.VITE_SITE_URL)) ?? DEFAULT_NANOHUB_SITE_URL
}

// Legacy alias
export const getClawHubSiteUrl = getNanoHubSiteUrl

export function getDocsSiteUrl() {
  const explicit = readMetaEnv(import.meta.env.VITE_SOULHUB_SITE_URL)
  if (explicit) return explicit

  const siteUrl = readMetaEnv(import.meta.env.VITE_SITE_URL)
  if (siteUrl) {
    try {
      const url = new URL(siteUrl)
      if (
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname === '0.0.0.0'
      ) {
        return url.origin
      }
    } catch {
      // ignore invalid URLs, fall through to default
    }
  }

  return DEFAULT_DOCS_SITE_URL
}

// Legacy aliases
export const getOnlyCrabsSiteUrl = getDocsSiteUrl

export function getDocsHost() {
  return readMetaEnv(import.meta.env.VITE_SOULHUB_HOST) ?? DEFAULT_DOCS_HOST
}

// Legacy alias
export const getOnlyCrabsHost = getDocsHost

export function detectSiteMode(host?: string | null): SiteMode {
  if (!host) return 'skills'
  const docsHost = getDocsHost().toLowerCase()
  const lower = host.toLowerCase()
  if (lower === docsHost || lower.endsWith(`.${docsHost}`)) return 'souls'
  return 'skills'
}

export function detectSiteModeFromUrl(value?: string | null): SiteMode {
  if (!value) return 'skills'
  try {
    const host = new URL(value).hostname
    return detectSiteMode(host)
  } catch {
    return detectSiteMode(value)
  }
}

export function getSiteMode(): SiteMode {
  if (typeof window !== 'undefined') {
    return detectSiteMode(window.location.hostname)
  }
  const forced = readMetaEnv(import.meta.env.VITE_SITE_MODE)
  if (forced === 'souls' || forced === 'skills') return forced

  const docsSite = readMetaEnv(import.meta.env.VITE_SOULHUB_SITE_URL)
  if (docsSite) return detectSiteModeFromUrl(docsSite)

  const siteUrl = readMetaEnv(import.meta.env.VITE_SITE_URL) ?? process.env.SITE_URL
  if (siteUrl) return detectSiteModeFromUrl(siteUrl)

  return 'skills'
}

export function getSiteName(mode: SiteMode = getSiteMode()) {
  return mode === 'souls' ? 'NanoSolana Docs' : 'NanoSolana Hub'
}

export function getSiteDescription(mode: SiteMode = getSiteMode()) {
  return mode === 'souls'
    ? 'NanoSolana Docs — the home for SOUL.md bundles and personal system lore.'
    : 'NanoSolana Hub — a fast skill registry for agents, with vector search.'
}

export function getSiteUrlForMode(mode: SiteMode = getSiteMode()) {
  return mode === 'souls' ? getDocsSiteUrl() : getNanoHubSiteUrl()
}
