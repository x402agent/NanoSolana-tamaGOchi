/**
 * NanoSolana Registry Module — barrel export.
 */

export {
  AgentRegistry,
  registerOnHeartbeat,
  TOKEN_METADATA_PROGRAM_ID,
} from "./agent-registry.js";

export type {
  AgentMetadata,
  RegistrationResult,
} from "./agent-registry.js";
