import Foundation

public enum NanoSolanaLocationMode: String, Codable, Sendable, CaseIterable {
    case off
    case whileUsing
    case always
}
