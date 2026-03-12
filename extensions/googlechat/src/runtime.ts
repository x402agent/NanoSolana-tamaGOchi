import { createPluginRuntimeStore } from "nanosolana/plugin-sdk/compat";
import type { PluginRuntime } from "nanosolana/plugin-sdk/googlechat";

const { setRuntime: setGoogleChatRuntime, getRuntime: getGoogleChatRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Google Chat runtime not initialized");
export { getGoogleChatRuntime, setGoogleChatRuntime };
