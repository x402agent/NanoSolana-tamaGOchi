import {
    classifyGatewayCheckException,
    classifyGatewayCheckResponse,
    classifyRelayCheckException,
    classifyRelayCheckResponse,
    describeGatewayApiFailure,
} from './options-validation.js'

const SOL_MINT = 'So11111111111111111111111111111111111111112'

const DEFAULTS = {
    relayPort: 18792,
    gatewayToken: '',
    gatewayBaseUrl: 'http://127.0.0.1:18790',
    gatewaySecret: '',
    chatId: 'extension-default',
    chatUserId: 'extension-user',
    chatUserName: 'chrome-extension',
    forwardToTelegram: false,
    tradeType: 'buy',
    tradeConfidence: '0.8',
    tradeMint: SOL_MINT,
    tradeSymbol: 'SOL',
    tradeReasoning: 'Manual extension trade request',
}

const STORAGE_KEYS = [
    'relayPort',
    'gatewayToken',
    'gatewayBaseUrl',
    'gatewaySecret',
    'chatId',
    'chatUserId',
    'chatUserName',
    'forwardToTelegram',
    'tradeType',
    'tradeConfidence',
    'tradeMint',
    'tradeSymbol',
    'tradeReasoning',
]

function el(id) {
    const node = document.getElementById(id)
    if (!node) {
        throw new Error(`Missing required element: #${id}`)
    }
    return node
}

const ui = {
    port: /** @type {HTMLInputElement} */ (el('port')),
    token: /** @type {HTMLInputElement} */ (el('token')),
    gatewayBaseUrl: /** @type {HTMLInputElement} */ (el('gateway-base-url')),
    gatewaySecret: /** @type {HTMLInputElement} */ (el('gateway-secret')),
    relayUrl: el('relay-url'),
    relayStatus: el('relay-status'),
    gatewayStatus: el('gateway-status'),
    save: /** @type {HTMLButtonElement} */ (el('save')),
    syncConfig: /** @type {HTMLButtonElement} */ (el('sync-config')),
    walletRefresh: /** @type {HTMLButtonElement} */ (el('wallet-refresh')),
    walletGenerate: /** @type {HTMLButtonElement} */ (el('wallet-generate')),
    walletStatus: el('wallet-status'),
    walletOutput: el('wallet-output'),
    chatId: /** @type {HTMLInputElement} */ (el('chat-id')),
    chatUserId: /** @type {HTMLInputElement} */ (el('chat-user-id')),
    chatUserName: /** @type {HTMLInputElement} */ (el('chat-user-name')),
    chatMessage: /** @type {HTMLTextAreaElement} */ (el('chat-message')),
    forwardToTelegram: /** @type {HTMLInputElement} */ (el('forward-to-telegram')),
    chatSend: /** @type {HTMLButtonElement} */ (el('chat-send')),
    saveTelegram: /** @type {HTMLButtonElement} */ (el('save-telegram')),
    chatStatus: el('chat-status'),
    chatOutput: el('chat-output'),
    tradeType: /** @type {HTMLSelectElement} */ (el('trade-type')),
    tradeConfidence: /** @type {HTMLInputElement} */ (el('trade-confidence')),
    tradeMint: /** @type {HTMLInputElement} */ (el('trade-mint')),
    tradeSymbol: /** @type {HTMLInputElement} */ (el('trade-symbol')),
    tradeReasoning: /** @type {HTMLInputElement} */ (el('trade-reasoning')),
    tradeSubmit: /** @type {HTMLButtonElement} */ (el('trade-submit')),
    tradeStatus: el('trade-status'),
    tradeOutput: el('trade-output'),
}

function setStatus(node, kind, message) {
    node.textContent = String(message || '')
    if (kind) {
        node.dataset.kind = kind
        return
    }
    delete node.dataset.kind
}

function setJsonOutput(node, payload) {
    const fallback = {}
    const value = payload == null ? fallback : payload
    try {
        node.textContent = JSON.stringify(value, null, 2)
    } catch {
        node.textContent = String(value)
    }
}

function clampConfidence(value) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return 0.8
    return Math.max(0, Math.min(1, parsed))
}

function sanitizePort(value) {
    const parsed = Number.parseInt(String(value || '').trim(), 10)
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) {
        return DEFAULTS.relayPort
    }
    return parsed
}

function normalizeBaseUrl(value) {
    const raw = String(value || '').trim()
    if (!raw) return DEFAULTS.gatewayBaseUrl

    const candidate = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`

    try {
        const parsed = new URL(candidate)
        return parsed.origin
    } catch {
        return DEFAULTS.gatewayBaseUrl
    }
}

function updateRelayUrlHint(port) {
    ui.relayUrl.textContent = `http://127.0.0.1:${port}/`
}

function currentSettingsFromForm() {
    const relayPort = sanitizePort(ui.port.value)
    const gatewayBaseUrl = normalizeBaseUrl(ui.gatewayBaseUrl.value)

    return {
        relayPort,
        gatewayToken: String(ui.token.value || '').trim(),
        gatewayBaseUrl,
        gatewaySecret: String(ui.gatewaySecret.value || '').trim(),
        chatId: String(ui.chatId.value || '').trim() || DEFAULTS.chatId,
        chatUserId: String(ui.chatUserId.value || '').trim() || DEFAULTS.chatUserId,
        chatUserName: String(ui.chatUserName.value || '').trim() || DEFAULTS.chatUserName,
        forwardToTelegram: Boolean(ui.forwardToTelegram.checked),
        tradeType: String(ui.tradeType.value || DEFAULTS.tradeType),
        tradeConfidence: String(clampConfidence(ui.tradeConfidence.value)),
        tradeMint: String(ui.tradeMint.value || '').trim() || SOL_MINT,
        tradeSymbol: String(ui.tradeSymbol.value || '').trim(),
        tradeReasoning: String(ui.tradeReasoning.value || '').trim() || DEFAULTS.tradeReasoning,
    }
}

function applySettingsToForm(settings) {
    const relayPort = sanitizePort(settings.relayPort)

    ui.port.value = String(relayPort)
    ui.token.value = String(settings.gatewayToken || '')
    ui.gatewayBaseUrl.value = normalizeBaseUrl(settings.gatewayBaseUrl)
    ui.gatewaySecret.value = String(settings.gatewaySecret || '')

    ui.chatId.value = String(settings.chatId || DEFAULTS.chatId)
    ui.chatUserId.value = String(settings.chatUserId || DEFAULTS.chatUserId)
    ui.chatUserName.value = String(settings.chatUserName || DEFAULTS.chatUserName)
    ui.forwardToTelegram.checked = Boolean(settings.forwardToTelegram)

    ui.tradeType.value = String(settings.tradeType || DEFAULTS.tradeType)
    ui.tradeConfidence.value = String(settings.tradeConfidence || DEFAULTS.tradeConfidence)
    ui.tradeMint.value = String(settings.tradeMint || DEFAULTS.tradeMint)
    ui.tradeSymbol.value = String(settings.tradeSymbol || DEFAULTS.tradeSymbol)
    ui.tradeReasoning.value = String(settings.tradeReasoning || DEFAULTS.tradeReasoning)

    updateRelayUrlHint(relayPort)
}

async function loadSettingsFromStorage() {
    const stored = await chrome.storage.local.get(STORAGE_KEYS)
    const merged = {
        ...DEFAULTS,
        ...stored,
    }

    merged.relayPort = sanitizePort(merged.relayPort)
    merged.gatewayBaseUrl = normalizeBaseUrl(merged.gatewayBaseUrl)
    merged.tradeConfidence = String(clampConfidence(merged.tradeConfidence))

    return merged
}

async function saveSettingsToStorage() {
    const settings = currentSettingsFromForm()
    await chrome.storage.local.set(settings)
    applySettingsToForm(settings)
    return settings
}

function sendRuntimeMessage(payload) {
    return chrome.runtime.sendMessage(payload)
}

async function requestGateway(method, path, body) {
    return await sendRuntimeMessage({
        type: 'gatewayApiRequest',
        method,
        path,
        body,
    })
}

async function checkRelayConnectivity(settings) {
    const port = sanitizePort(settings.relayPort)
    const relayUrl = `http://127.0.0.1:${port}/json/version`

    try {
        const res = await sendRuntimeMessage({
            type: 'relayCheck',
            url: relayUrl,
            token: settings.gatewayToken,
        })

        const verdict = classifyRelayCheckResponse(res, port)
        if (verdict.action === 'throw') {
            throw new Error(verdict.error)
        }

        setStatus(ui.relayStatus, verdict.kind, verdict.message)
    } catch (err) {
        const fallback = classifyRelayCheckException(err, port)
        setStatus(ui.relayStatus, fallback.kind, fallback.message)
    }
}

function applyGatewayConfigPayload(payload) {
    const relayPort = sanitizePort(payload?.relay?.port)
    if (relayPort) {
        ui.port.value = String(relayPort)
    }

    const rawGatewayHost = String(payload?.gateway?.host || '').trim()
    const gatewayHost = rawGatewayHost === '0.0.0.0' ? '127.0.0.1' : rawGatewayHost
    const gatewayPort = Number(payload?.gateway?.port)
    if (gatewayHost && Number.isFinite(gatewayPort) && gatewayPort > 0) {
        const current = normalizeBaseUrl(ui.gatewayBaseUrl.value)
        const protocol = current.startsWith('https://') ? 'https' : 'http'
        ui.gatewayBaseUrl.value = `${protocol}://${gatewayHost}:${gatewayPort}`
    }

    if (payload?.telegram && typeof payload.telegram === 'object') {
        ui.forwardToTelegram.checked = Boolean(payload.telegram.enabled)
        ui.chatId.value = String(payload.telegram.chatId || ui.chatId.value || DEFAULTS.chatId)
        ui.chatUserName.value = String(payload.telegram.userName || ui.chatUserName.value || DEFAULTS.chatUserName)
    }

    updateRelayUrlHint(sanitizePort(ui.port.value))
}

async function checkGatewayConnectivity({ applyConfig = false } = {}) {
    try {
        const [healthRes, extensionRes] = await Promise.all([
            requestGateway('GET', '/health'),
            requestGateway('GET', '/api/extension/config'),
        ])

        const verdict = classifyGatewayCheckResponse(healthRes, extensionRes)
        if (verdict.action === 'throw') {
            throw new Error(verdict.error)
        }

        setStatus(ui.gatewayStatus, verdict.kind, verdict.message)

        if (applyConfig && verdict.details?.extension) {
            applyGatewayConfigPayload(verdict.details.extension)
            await saveSettingsToStorage()
        }
    } catch (err) {
        const fallback = classifyGatewayCheckException(err)
        setStatus(ui.gatewayStatus, fallback.kind, fallback.message)
    }
}

async function onSaveAndCheck() {
    ui.save.disabled = true

    try {
        setStatus(ui.relayStatus, '', 'Saving settings and checking relay...')
        setStatus(ui.gatewayStatus, '', 'Checking gateway...')
        const settings = await saveSettingsToStorage()

        await Promise.all([
            checkRelayConnectivity(settings),
            checkGatewayConnectivity(),
        ])
    } finally {
        ui.save.disabled = false
    }
}

async function onSyncConfig() {
    ui.syncConfig.disabled = true
    setStatus(ui.gatewayStatus, '', 'Loading extension config from gateway...')

    try {
        const res = await requestGateway('GET', '/api/extension/config')
        if (!res?.ok) {
            setStatus(ui.gatewayStatus, 'error', describeGatewayApiFailure(res, 'Could not load extension config'))
            return
        }

        applyGatewayConfigPayload(res.json || {})
        await saveSettingsToStorage()
        setStatus(ui.gatewayStatus, 'ok', 'Loaded config from gateway and synced local form values.')
    } catch (err) {
        const fallback = classifyGatewayCheckException(err)
        setStatus(ui.gatewayStatus, fallback.kind, fallback.message)
    } finally {
        ui.syncConfig.disabled = false
    }
}

async function runWalletAction(action) {
    const isGenerate = action === 'generate'
    const requestAction = isGenerate ? 'generate' : 'status'
    const button = isGenerate ? ui.walletGenerate : ui.walletRefresh
    button.disabled = true

    setStatus(
        ui.walletStatus,
        '',
        isGenerate ? 'Generating / rehydrating wallet from gateway...' : 'Refreshing wallet status from gateway...',
    )

    try {
        const res = await requestGateway(
            'POST',
            '/api/extension/wallet',
            { action: requestAction },
        )

        if (!res?.ok) {
            setStatus(ui.walletStatus, 'error', describeGatewayApiFailure(res, 'Wallet request failed'))
            setJsonOutput(ui.walletOutput, res?.json || res || {})
            return
        }

        setStatus(
            ui.walletStatus,
            'ok',
            isGenerate
                ? 'Wallet generated/rehydrated successfully.'
                : 'Wallet status refreshed successfully.',
        )
        setJsonOutput(ui.walletOutput, res.json || {})
    } catch (err) {
        setStatus(ui.walletStatus, 'error', `Wallet request failed: ${String(err)}`)
    } finally {
        button.disabled = false
    }
}

async function onSaveTelegramConfig() {
    ui.saveTelegram.disabled = true
    setStatus(ui.chatStatus, '', 'Saving Telegram relay config...')

    try {
        const settings = await saveSettingsToStorage()

        const res = await requestGateway('POST', '/api/extension/config', {
            telegram: {
                enabled: settings.forwardToTelegram,
                chatId: settings.chatId,
                userName: settings.chatUserName,
            },
        })

        if (!res?.ok) {
            setStatus(ui.chatStatus, 'error', describeGatewayApiFailure(res, 'Could not save Telegram relay config'))
            setJsonOutput(ui.chatOutput, res?.json || res || {})
            return
        }

        setStatus(ui.chatStatus, 'ok', 'Telegram relay settings saved to gateway.')
        setJsonOutput(ui.chatOutput, res.json || {})
    } catch (err) {
        setStatus(ui.chatStatus, 'error', `Could not save Telegram relay config: ${String(err)}`)
    } finally {
        ui.saveTelegram.disabled = false
    }
}

async function onSendChat() {
    ui.chatSend.disabled = true

    const message = String(ui.chatMessage.value || '').trim()
    if (!message) {
        setStatus(ui.chatStatus, 'error', 'Enter a message before sending chat.')
        ui.chatSend.disabled = false
        return
    }

    setStatus(ui.chatStatus, '', 'Sending message through NanoSolana gateway...')

    try {
        const settings = await saveSettingsToStorage()

        const res = await requestGateway('POST', '/api/extension/chat', {
            chatId: settings.chatId,
            userId: settings.chatUserId,
            userName: settings.chatUserName,
            message,
            forwardToTelegram: settings.forwardToTelegram,
        })

        if (!res?.ok) {
            setStatus(ui.chatStatus, 'error', describeGatewayApiFailure(res, 'Chat request failed'))
            setJsonOutput(ui.chatOutput, res?.json || res || {})
            return
        }

        setStatus(ui.chatStatus, 'ok', settings.forwardToTelegram
            ? 'Chat sent and marked for Telegram forwarding.'
            : 'Chat sent through gateway.')
        setJsonOutput(ui.chatOutput, res.json || {})
    } catch (err) {
        setStatus(ui.chatStatus, 'error', `Chat request failed: ${String(err)}`)
    } finally {
        ui.chatSend.disabled = false
    }
}

async function onSubmitTrade() {
    ui.tradeSubmit.disabled = true
    setStatus(ui.tradeStatus, '', 'Submitting manual trade request...')

    try {
        const settings = await saveSettingsToStorage()
        const payload = {
            type: settings.tradeType,
            confidence: clampConfidence(settings.tradeConfidence),
            mint: settings.tradeMint,
            symbol: settings.tradeSymbol || undefined,
            reasoning: settings.tradeReasoning,
        }

        const res = await requestGateway('POST', '/api/extension/trade', payload)
        if (!res?.ok) {
            setStatus(ui.tradeStatus, 'error', describeGatewayApiFailure(res, 'Trade submission failed'))
            setJsonOutput(ui.tradeOutput, res?.json || res || {})
            return
        }

        setStatus(ui.tradeStatus, 'ok', 'Manual trade submitted to NanoSolana gateway.')
        setJsonOutput(ui.tradeOutput, res.json || {})
    } catch (err) {
        setStatus(ui.tradeStatus, 'error', `Trade submission failed: ${String(err)}`)
    } finally {
        ui.tradeSubmit.disabled = false
    }
}

function bindEvents() {
    ui.port.addEventListener('input', () => {
        updateRelayUrlHint(sanitizePort(ui.port.value))
    })

    ui.save.addEventListener('click', () => {
        void onSaveAndCheck()
    })

    ui.syncConfig.addEventListener('click', () => {
        void onSyncConfig()
    })

    ui.walletRefresh.addEventListener('click', () => {
        void runWalletAction('status')
    })

    ui.walletGenerate.addEventListener('click', () => {
        void runWalletAction('generate')
    })

    ui.saveTelegram.addEventListener('click', () => {
        void onSaveTelegramConfig()
    })

    ui.chatSend.addEventListener('click', () => {
        void onSendChat()
    })

    ui.tradeSubmit.addEventListener('click', () => {
        void onSubmitTrade()
    })
}

async function init() {
    bindEvents()

    setJsonOutput(ui.walletOutput, {})
    setJsonOutput(ui.chatOutput, {})
    setJsonOutput(ui.tradeOutput, {})

    try {
        const settings = await loadSettingsFromStorage()
        applySettingsToForm(settings)
        setStatus(ui.relayStatus, '', 'Loaded saved settings.')
        setStatus(ui.gatewayStatus, '', 'Loaded saved settings.')
    } catch (err) {
        setStatus(ui.relayStatus, 'error', `Failed to load saved settings: ${String(err)}`)
        setStatus(ui.gatewayStatus, 'error', 'Failed to load saved settings.')
    }

    const settings = currentSettingsFromForm()
    await Promise.all([
        checkRelayConnectivity(settings),
        checkGatewayConnectivity(),
    ])
}

void init()
