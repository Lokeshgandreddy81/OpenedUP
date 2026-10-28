import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LandingNavbar } from "../components/landing/LandingNavbar";
import { SaraFooter } from "../components/landing/SaraFooter";
import { InsightsHero } from "../components/insights/InsightsHero";
import { InsightVersions } from "../components/insights/InsightVersions";
import { InsightCapabilities } from "../components/insights/InsightCapabilities";
import { InsightWorkflow } from "../components/insights/InsightWorkflow";
import { InsightMetrics } from "../components/insights/InsightMetrics";
import { InsightsCta } from "../components/insights/InsightsCta";

export const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, []);

  const handleStart = () => {
    navigate("/chat");
  };

  return (
    <div
      ref={containerRef}
      className="openedup-home h-dvh w-full overflow-y-auto overflow-x-hidden bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white"
    >
      <LandingNavbar onGetStarted={handleStart} />

      <main>
        <InsightsHero />
        <InsightVersions />
        <InsightCapabilities />
        <InsightWorkflow />
        <InsightMetrics />
        <InsightsCta onExplore={() => navigate("/features")} onStart={handleStart} />
      </main>

      <SaraFooter />
    </div>
  );
};

export default InsightsPage;
