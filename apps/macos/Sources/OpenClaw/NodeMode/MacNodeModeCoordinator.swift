import Foundation
import NanoSolanaKit
import OSLog

@MainActor
final class MacNodeModeCoordinator {
    static let shared = MacNodeModeCoordinator()

    private let logger = Logger(subsystem: "ai.nanosolana", category: "mac-node")
    private var task: Task<Void, Never>?
    private let runtime = MacNodeRuntime()
    private let session = GatewayNodeSession()

    func start() {
        guard self.task == nil else { return }
        self.task = Task { [weak self] in
            await self?.run()
        }
    }

    func stop() {
        self.task?.cancel()
        self.task = nil
        Task { await self.session.disconnect() }
    }

    func setPreferredGatewayStableID(_ stableID: String?) {
        GatewayDiscoveryPreferences.setPreferredStableID(stableID)
        Task { await self.session.disconnect() }
    }

    private func run() async {
        var retryDelay: UInt64 = 1_000_000_000
        var lastCameraEnabled: Bool?
        var lastBrowserControlEnabled: Bool?
        let defaults = UserDefaults.standard

        while !Task.isCancelled {
            if await MainActor.run(body: { AppStateStore.shared.isPaused }) {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                continue
            }

            let cameraEnabled = defaults.object(forKey: cameraEnabledKey) as? Bool ?? false
            if lastCameraEnabled == nil {
                lastCameraEnabled = cameraEnabled
            } else if lastCameraEnabled != cameraEnabled {
                lastCameraEnabled = cameraEnabled
                await self.session.disconnect()
                try? await Task.sleep(nanoseconds: 200_000_000)
            }
            let browserControlEnabled = NanoSolanaConfigFile.browserControlEnabled()
            if lastBrowserControlEnabled == nil {
                lastBrowserControlEnabled = browserControlEnabled
            } else if lastBrowserControlEnabled != browserControlEnabled {
                lastBrowserControlEnabled = browserControlEnabled
                await self.session.disconnect()
                try? await Task.sleep(nanoseconds: 200_000_000)
            }

            do {
                let config = try await GatewayEndpointStore.shared.requireConfig()
                let caps = self.currentCaps()
                let commands = self.currentCommands(caps: caps)
                let permissions = await self.currentPermissions()
                let connectOptions = GatewayConnectOptions(
                    role: "node",
                    scopes: [],
                    caps: caps,
                    commands: commands,
                    permissions: permissions,
                    clientId: "nanosolana-macos",
                    clientMode: "node",
                    clientDisplayName: InstanceIdentity.displayName)
                let sessionBox = self.buildSessionBox(url: config.url)

                try await self.session.connect(
                    url: config.url,
                    token: config.token,
                    password: config.password,
                    connectOptions: connectOptions,
                    sessionBox: sessionBox,
                    onConnected: { [weak self] in
                        guard let self else { return }
                        self.logger.info("mac node connected to gateway")
                        let mainSessionKey = await GatewayConnection.shared.mainSessionKey()
                        await self.runtime.updateMainSessionKey(mainSessionKey)
                        await self.runtime.setEventSender { [weak self] event, payload in
                            guard let self else { return }
                            await self.session.sendEvent(event: event, payloadJSON: payload)
                        }
                    },
                    onDisconnected: { [weak self] reason in
                        guard let self else { return }
                        await self.runtime.setEventSender(nil)
                        self.logger.error("mac node disconnected: \(reason, privacy: .public)")
                    },
                    onInvoke: { [weak self] req in
                        guard let self else {
                            return BridgeInvokeResponse(
                                id: req.id,
                                ok: false,
                                error: NanoSolanaNodeError(code: .unavailable, message: "UNAVAILABLE: node not ready"))
                        }
                        return await self.runtime.handleInvoke(req)
                    })

                retryDelay = 1_000_000_000
                try? await Task.sleep(nanoseconds: 1_000_000_000)
            } catch {
                self.logger.error("mac node gateway connect failed: \(error.localizedDescription, privacy: .public)")
                try? await Task.sleep(nanoseconds: min(retryDelay, 10_000_000_000))
                retryDelay = min(retryDelay * 2, 10_000_000_000)
            }
        }
    }

    private func currentCaps() -> [String] {
        var caps: [String] = [NanoSolanaCapability.canvas.rawValue, NanoSolanaCapability.screen.rawValue]
        if NanoSolanaConfigFile.browserControlEnabled() {
            caps.append(NanoSolanaCapability.browser.rawValue)
        }
        if UserDefaults.standard.object(forKey: cameraEnabledKey) as? Bool ?? false {
            caps.append(NanoSolanaCapability.camera.rawValue)
        }
        let rawLocationMode = UserDefaults.standard.string(forKey: locationModeKey) ?? "off"
        if NanoSolanaLocationMode(rawValue: rawLocationMode) != .off {
            caps.append(NanoSolanaCapability.location.rawValue)
        }
        return caps
    }

    private func currentPermissions() async -> [String: Bool] {
        let statuses = await PermissionManager.status()
        return Dictionary(uniqueKeysWithValues: statuses.map { ($0.key.rawValue, $0.value) })
    }

    private func currentCommands(caps: [String]) -> [String] {
        var commands: [String] = [
            NanoSolanaCanvasCommand.present.rawValue,
            NanoSolanaCanvasCommand.hide.rawValue,
            NanoSolanaCanvasCommand.navigate.rawValue,
            NanoSolanaCanvasCommand.evalJS.rawValue,
            NanoSolanaCanvasCommand.snapshot.rawValue,
            NanoSolanaCanvasA2UICommand.push.rawValue,
            NanoSolanaCanvasA2UICommand.pushJSONL.rawValue,
            NanoSolanaCanvasA2UICommand.reset.rawValue,
            MacNodeScreenCommand.record.rawValue,
            NanoSolanaSystemCommand.notify.rawValue,
            NanoSolanaSystemCommand.which.rawValue,
            NanoSolanaSystemCommand.run.rawValue,
            NanoSolanaSystemCommand.execApprovalsGet.rawValue,
            NanoSolanaSystemCommand.execApprovalsSet.rawValue,
        ]

        let capsSet = Set(caps)
        if capsSet.contains(NanoSolanaCapability.browser.rawValue) {
            commands.append(NanoSolanaBrowserCommand.proxy.rawValue)
        }
        if capsSet.contains(NanoSolanaCapability.camera.rawValue) {
            commands.append(NanoSolanaCameraCommand.list.rawValue)
            commands.append(NanoSolanaCameraCommand.snap.rawValue)
            commands.append(NanoSolanaCameraCommand.clip.rawValue)
        }
        if capsSet.contains(NanoSolanaCapability.location.rawValue) {
            commands.append(NanoSolanaLocationCommand.get.rawValue)
        }

        return commands
    }

    private func buildSessionBox(url: URL) -> WebSocketSessionBox? {
        guard url.scheme?.lowercased() == "wss" else { return nil }
        let host = url.host ?? "gateway"
        let port = url.port ?? 443
        let stableID = "\(host):\(port)"
        let stored = GatewayTLSStore.loadFingerprint(stableID: stableID)
        let params = GatewayTLSParams(
            required: true,
            expectedFingerprint: stored,
            allowTOFU: stored == nil,
            storeKey: stableID)
        let session = GatewayTLSPinningSession(params: params)
        return WebSocketSessionBox(session: session)
    }
}
