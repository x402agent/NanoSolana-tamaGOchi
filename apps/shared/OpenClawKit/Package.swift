// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "NanoSolanaKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "NanoSolanaProtocol", targets: ["NanoSolanaProtocol"]),
        .library(name: "NanoSolanaKit", targets: ["NanoSolanaKit"]),
        .library(name: "NanoSolanaChatUI", targets: ["NanoSolanaChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "NanoSolanaProtocol",
            path: "Sources/NanoSolanaProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "NanoSolanaKit",
            dependencies: [
                "NanoSolanaProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/NanoSolanaKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "NanoSolanaChatUI",
            dependencies: [
                "NanoSolanaKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/NanoSolanaChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "NanoSolanaKitTests",
            dependencies: ["NanoSolanaKit", "NanoSolanaChatUI"],
            path: "Tests/NanoSolanaKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
