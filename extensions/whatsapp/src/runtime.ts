import { createPluginRuntimeStore } from "nanosolana/plugin-sdk/compat";
import type { PluginRuntime } from "nanosolana/plugin-sdk/whatsapp";

const { setRuntime: setWhatsAppRuntime, getRuntime: getWhatsAppRuntime } =
  createPluginRuntimeStore<PluginRuntime>("WhatsApp runtime not initialized");
export { getWhatsAppRuntime, setWhatsAppRuntime };
