/**
 * JT AI Core application contract.
 *
 * This module is the shared policy vocabulary for JT apps. Host applications
 * must call authorizeCapability in their trusted main/native process before
 * dispatching a tool. Renderer/UI state is never an authorization boundary.
 */
export const JT_APP_IDS = [
  "jeff-ai",
  "jt-desktop-agent",
  "jt-studio",
  "jt-motion",
  "jt-code",
  "jt-design",
  "jt-cloud",
  "jt-stream",
  "jt-app-manager"
] as const;

export type JTAppId = (typeof JT_APP_IDS)[number];
export type JTCapability =
  | "ai.chat"
  | "ai.vision"
  | "files.read-selected"
  | "files.write-approved"
  | "media.microphone"
  | "media.camera"
  | "media.capture-screen"
  | "media.export"
  | "code.workspace-read"
  | "code.workspace-write-approved"
  | "code.terminal-approved"
  | "cloud.sync-approved"
  | "desktop.control-approved"
  | "apps.install-approved"
  | "apps.update-approved";

const APP_CAPABILITIES: Record<JTAppId, readonly JTCapability[]> = {
  "jeff-ai": ["ai.chat", "ai.vision", "files.read-selected"],
  "jt-desktop-agent": [
    "ai.chat", "ai.vision", "files.read-selected", "files.write-approved",
    "code.workspace-read", "code.workspace-write-approved", "code.terminal-approved",
    "desktop.control-approved"
  ],
  "jt-studio": ["ai.chat", "files.read-selected", "media.microphone", "media.export"],
  "jt-motion": ["ai.chat", "files.read-selected", "media.export"],
  "jt-code": ["ai.chat", "files.read-selected", "code.workspace-read", "code.workspace-write-approved", "code.terminal-approved"],
  "jt-design": ["ai.chat", "files.read-selected", "files.write-approved", "media.export"],
  "jt-cloud": ["ai.chat", "files.read-selected", "cloud.sync-approved"],
  "jt-stream": ["ai.chat", "media.microphone", "media.camera", "media.capture-screen", "media.export"],
  "jt-app-manager": ["ai.chat", "files.read-selected", "apps.install-approved", "apps.update-approved"]
};

export type JTAuthorization = {
  allowed: boolean;
  appId: JTAppId;
  capability: JTCapability;
  requiresUserApproval: boolean;
  reason: string;
};

const APPROVAL_REQUIRED = new Set<JTCapability>([
  "files.write-approved",
  "code.workspace-write-approved",
  "code.terminal-approved",
  "cloud.sync-approved",
  "desktop.control-approved",
  "apps.install-approved",
  "apps.update-approved"
]);

export function authorizeCapability(
  appId: JTAppId,
  capability: JTCapability,
  userApproved = false
): JTAuthorization {
  const inAppScope = APP_CAPABILITIES[appId].includes(capability);
  const requiresUserApproval = APPROVAL_REQUIRED.has(capability);
  if (!inAppScope) {
    return { allowed: false, appId, capability, requiresUserApproval, reason: "This capability is not granted to this JT app." };
  }
  if (requiresUserApproval && !userApproved) {
    return { allowed: false, appId, capability, requiresUserApproval, reason: "Explicit user approval is required for this operation." };
  }
  return { allowed: true, appId, capability, requiresUserApproval, reason: "Capability is within this app's scope." };
}

export function assertCapability(
  appId: JTAppId,
  capability: JTCapability,
  userApproved = false
): void {
  const result = authorizeCapability(appId, capability, userApproved);
  if (!result.allowed) throw new Error(result.reason);
}
