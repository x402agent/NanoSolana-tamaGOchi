import Foundation

public enum NanoSolanaCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum NanoSolanaCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum NanoSolanaCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum NanoSolanaCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct NanoSolanaCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: NanoSolanaCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: NanoSolanaCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: NanoSolanaCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: NanoSolanaCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct NanoSolanaCameraClipParams: Codable, Sendable, Equatable {
    public var facing: NanoSolanaCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: NanoSolanaCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: NanoSolanaCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: NanoSolanaCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
