import { createPluginRuntimeStore } from "nanosolana/plugin-sdk/compat";
import type { PluginRuntime } from "nanosolana/plugin-sdk/matrix";

const { setRuntime: setMatrixRuntime, getRuntime: getMatrixRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Matrix runtime not initialized");
export { getMatrixRuntime, setMatrixRuntime };
