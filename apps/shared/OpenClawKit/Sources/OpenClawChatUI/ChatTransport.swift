import Foundation

public enum NanoSolanaChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(NanoSolanaChatEventPayload)
    case agent(NanoSolanaAgentEventPayload)
    case seqGap
}

public protocol NanoSolanaChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> NanoSolanaChatHistoryPayload
    func listModels() async throws -> [NanoSolanaChatModelChoice]
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [NanoSolanaChatAttachmentPayload]) async throws -> NanoSolanaChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> NanoSolanaChatSessionsListResponse
    func setSessionModel(sessionKey: String, model: String?) async throws
    func setSessionThinking(sessionKey: String, thinkingLevel: String) async throws

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<NanoSolanaChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension NanoSolanaChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "NanoSolanaChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> NanoSolanaChatSessionsListResponse {
        throw NSError(
            domain: "NanoSolanaChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }

    public func listModels() async throws -> [NanoSolanaChatModelChoice] {
        throw NSError(
            domain: "NanoSolanaChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "models.list not supported by this transport"])
    }

    public func setSessionModel(sessionKey _: String, model _: String?) async throws {
        throw NSError(
            domain: "NanoSolanaChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.patch(model) not supported by this transport"])
    }

    public func setSessionThinking(sessionKey _: String, thinkingLevel _: String) async throws {
        throw NSError(
            domain: "NanoSolanaChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.patch(thinkingLevel) not supported by this transport"])
    }
}
