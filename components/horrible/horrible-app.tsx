"use client";

import { useBuildSession } from "@/hooks/use-build-session";
import { Hero } from "./hero";
import { BuildView } from "./build-view";

export function HorribleApp() {
  const { state, startBuild, makeItWorse, stop, startOver } = useBuildSession();

  if (state.phase === "prompt") {
    return <Hero onSubmit={startBuild} submitting={state.starting} />;
  }

  return (
    <BuildView
      events={state.events}
      sessionInfo={state.sessionInfo}
      status={state.status}
      siteHtml={state.siteHtml}
      onMakeItWorse={makeItWorse}
      onStop={stop}
      onStartOver={startOver}
    />
  );
}
