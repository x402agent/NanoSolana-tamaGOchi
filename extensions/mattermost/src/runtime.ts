import { createPluginRuntimeStore } from "nanosolana/plugin-sdk/compat";
import type { PluginRuntime } from "nanosolana/plugin-sdk/mattermost";

const { setRuntime: setMattermostRuntime, getRuntime: getMattermostRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Mattermost runtime not initialized");
export { getMattermostRuntime, setMattermostRuntime };
