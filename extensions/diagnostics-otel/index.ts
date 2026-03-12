import type { NanoSolanaPluginApi } from "nanosolana/plugin-sdk/diagnostics-otel";
import { emptyPluginConfigSchema } from "nanosolana/plugin-sdk/diagnostics-otel";
import { createDiagnosticsOtelService } from "./src/service.js";

const plugin = {
  id: "diagnostics-otel",
  name: "Diagnostics OpenTelemetry",
  description: "Export diagnostics events to OpenTelemetry",
  configSchema: emptyPluginConfigSchema(),
  register(api: NanoSolanaPluginApi) {
    api.registerService(createDiagnosticsOtelService());
  },
};

export default plugin;
