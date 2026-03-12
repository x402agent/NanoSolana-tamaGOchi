import type {
  AnyAgentTool,
  NanoSolanaPluginApi,
  NanoSolanaPluginToolFactory,
} from "nanosolana/plugin-sdk/lobster";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: NanoSolanaPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as NanoSolanaPluginToolFactory,
    { optional: true },
  );
}
