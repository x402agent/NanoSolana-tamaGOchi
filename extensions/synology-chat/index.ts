import type { NanoSolanaPluginApi } from "nanosolana/plugin-sdk/synology-chat";
import { emptyPluginConfigSchema } from "nanosolana/plugin-sdk/synology-chat";
import { createSynologyChatPlugin } from "./src/channel.js";
import { setSynologyRuntime } from "./src/runtime.js";

const plugin = {
  id: "synology-chat",
  name: "Synology Chat",
  description: "Native Synology Chat channel plugin for NanoSolana",
  configSchema: emptyPluginConfigSchema(),
  register(api: NanoSolanaPluginApi) {
    setSynologyRuntime(api.runtime);
    api.registerChannel({ plugin: createSynologyChatPlugin() });
  },
};

export default plugin;
