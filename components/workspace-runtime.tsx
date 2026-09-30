"use client";

import AnnouncementHost from "@/components/announcements/announcement-host";
import PilotFeedbackHost from "@/components/feedback/pilot-feedback-host";
import SupportTelemetryHost from "@/components/support/support-telemetry-host";

/**
 * Authenticated workspace-only client services.
 * Keep these out of the root layout so public/auth routes never call
 * session-protected APIs or collect workspace diagnostics.
 */
export default function WorkspaceRuntime(){
  return <>
    <AnnouncementHost/>
    <SupportTelemetryHost/>
    <PilotFeedbackHost/>
  </>;
}
