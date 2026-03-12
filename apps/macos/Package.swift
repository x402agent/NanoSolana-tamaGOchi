// swift-tools-version: 6.2
// Package manifest for the NanoSolana macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "NanoSolana",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "NanoSolanaIPC", targets: ["NanoSolanaIPC"]),
        .library(name: "NanoSolanaDiscovery", targets: ["NanoSolanaDiscovery"]),
        .executable(name: "NanoSolana", targets: ["NanoSolana"]),
        .executable(name: "nanosolana-mac", targets: ["NanoSolanaMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/NanoSolanaKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "NanoSolanaIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "NanoSolanaDiscovery",
            dependencies: [
                .product(name: "NanoSolanaKit", package: "NanoSolanaKit"),
            ],
            path: "Sources/NanoSolanaDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "NanoSolana",
            dependencies: [
                "NanoSolanaIPC",
                "NanoSolanaDiscovery",
                .product(name: "NanoSolanaKit", package: "NanoSolanaKit"),
                .product(name: "NanoSolanaChatUI", package: "NanoSolanaKit"),
                .product(name: "NanoSolanaProtocol", package: "NanoSolanaKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/NanoSolana.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "NanoSolanaMacCLI",
            dependencies: [
                "NanoSolanaDiscovery",
                .product(name: "NanoSolanaKit", package: "NanoSolanaKit"),
                .product(name: "NanoSolanaProtocol", package: "NanoSolanaKit"),
            ],
            path: "Sources/NanoSolanaMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "NanoSolanaIPCTests",
            dependencies: [
                "NanoSolanaIPC",
                "NanoSolana",
                "NanoSolanaDiscovery",
                .product(name: "NanoSolanaProtocol", package: "NanoSolanaKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
