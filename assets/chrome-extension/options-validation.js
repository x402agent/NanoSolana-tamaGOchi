const PORT_GUIDANCE = 'Use gateway port + 3 (for gateway 18789, relay is 18792).'
const GATEWAY_GUIDANCE = 'Verify gateway base URL and shared secret in extension settings.'

function hasCdpVersionShape(data) {
  return !!data && typeof data === 'object' && 'Browser' in data && 'Protocol-Version' in data
}

function hasGatewayHealthShape(data) {
  return !!data && typeof data === 'object' && data.status === 'ok' && 'agentId' in data
}

function hasGatewayExtensionShape(data) {
  return !!data && typeof data === 'object' && 'relay' in data && 'gateway' in data
}

function extractGatewayMessage(res) {
  if (!res || typeof res !== 'object') return ''
  const payload = res.json
  if (!payload || typeof payload !== 'object') return ''

  const message = typeof payload.message === 'string' ? payload.message.trim() : ''
  if (message) return message

  const error = typeof payload.error === 'string' ? payload.error.trim() : ''
  if (error) return error

  return ''
}

export function classifyRelayCheckResponse(res, port) {
  if (!res) {
    return { action: 'throw', error: 'No response from service worker' }
  }

  if (res.status === 401) {
    return { action: 'status', kind: 'error', message: 'Gateway token rejected. Check token and save again.' }
  }

  if (res.error) {
    return { action: 'throw', error: res.error }
  }

  if (!res.ok) {
    return { action: 'throw', error: `HTTP ${res.status}` }
  }

  const contentType = String(res.contentType || '')
  if (!contentType.includes('application/json')) {
    return {
      action: 'status',
      kind: 'error',
      message: `Wrong port: this is likely the gateway, not the relay. ${PORT_GUIDANCE}`,
    }
  }

  if (!hasCdpVersionShape(res.json)) {
    return {
      action: 'status',
      kind: 'error',
      message: `Wrong port: expected relay /json/version response. ${PORT_GUIDANCE}`,
    }
  }

  return { action: 'status', kind: 'ok', message: `Relay reachable and authenticated at http://127.0.0.1:${port}/` }
}

export function classifyRelayCheckException(err, port) {
  const message = String(err || '').toLowerCase()
  if (message.includes('json') || message.includes('syntax')) {
    return {
      kind: 'error',
      message: `Wrong port: this is not a relay endpoint. ${PORT_GUIDANCE}`,
    }
  }

  return {
    kind: 'error',
    message: `Relay not reachable/authenticated at http://127.0.0.1:${port}/. Start NanoSolana browser relay and verify token.`,
  }
}

export function classifyGatewayCheckResponse(healthRes, extensionRes) {
  if (!healthRes || !extensionRes) {
    return { action: 'throw', error: 'No response from gateway service worker request' }
  }

  if (healthRes.error) {
    return { action: 'throw', error: healthRes.error }
  }

  if (extensionRes.error) {
    return { action: 'throw', error: extensionRes.error }
  }

  if (healthRes.status === 401 || extensionRes.status === 401) {
    return {
      action: 'status',
      kind: 'error',
      message: 'Gateway secret rejected. Save the correct secret and retry.',
    }
  }

  if (!healthRes.ok) {
    const detail = extractGatewayMessage(healthRes)
    return {
      action: 'status',
      kind: 'error',
      message: detail
        ? `Gateway health check failed (HTTP ${healthRes.status}): ${detail}`
        : `Gateway health check failed (HTTP ${healthRes.status}). ${GATEWAY_GUIDANCE}`,
    }
  }

  if (!extensionRes.ok) {
    const detail = extractGatewayMessage(extensionRes)
    return {
      action: 'status',
      kind: 'error',
      message: detail
        ? `Gateway extension API unavailable (HTTP ${extensionRes.status}): ${detail}`
        : `Gateway extension API unavailable (HTTP ${extensionRes.status}). ${GATEWAY_GUIDANCE}`,
    }
  }

  if (!hasGatewayHealthShape(healthRes.json)) {
    return {
      action: 'status',
      kind: 'error',
      message: `Unexpected /health payload from gateway. ${GATEWAY_GUIDANCE}`,
    }
  }

  if (!hasGatewayExtensionShape(extensionRes.json)) {
    return {
      action: 'status',
      kind: 'error',
      message: `Unexpected /api/extension/config payload. Ensure NanoSolana gateway extension APIs are enabled.`,
    }
  }

  const health = healthRes.json
  const extension = extensionRes.json
  const host = extension.gateway?.host || '127.0.0.1'
  const port = extension.gateway?.port || 'unknown'
  const auth = extension.gateway?.authRequired ? 'shared-secret auth enabled' : 'auth optional'

  return {
    action: 'status',
    kind: 'ok',
    message: `Gateway reachable at ${host}:${port} (${auth}). Agent ${health.agentId} online.`,
    details: {
      health,
      extension,
    },
  }
}

export function classifyGatewayCheckException(err) {
  const message = String(err || '')
  if (message.toLowerCase().includes('failed to fetch')) {
    return {
      kind: 'error',
      message: `Gateway request failed (network error). ${GATEWAY_GUIDANCE}`,
    }
  }

  return {
    kind: 'error',
    message: `Gateway request failed: ${message || 'unknown error'}. ${GATEWAY_GUIDANCE}`,
  }
}

export function describeGatewayApiFailure(res, fallbackMessage) {
  const fallback = String(fallbackMessage || 'Gateway request failed')

  if (!res) {
    return fallback
  }

  if (res.status === 401) {
    return 'Gateway secret rejected. Save the correct secret and retry.'
  }

  const detail = extractGatewayMessage(res)
  if (detail) {
    return `${fallback}: ${detail}`
  }

  if (res.status) {
    return `${fallback} (HTTP ${res.status})`
  }

  if (res.error) {
    return `${fallback}: ${res.error}`
  }

  return fallback
}
