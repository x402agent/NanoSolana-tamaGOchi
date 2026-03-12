import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#nanosolana",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#nanosolana",
      rawTarget: "#nanosolana",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "nanosolana-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "nanosolana-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "nanosolana-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "nanosolana-bot",
      rawTarget: "nanosolana-bot",
    });
  });
});
