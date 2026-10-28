import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LandingNavbar } from "../components/landing/LandingNavbar";
import { SaraFooter } from "../components/landing/SaraFooter";
import { FeatureHero } from "../components/features/FeatureHero";
import { CapabilityCarousel } from "../components/features/CapabilityCarousel";
import { TrustSection } from "../components/features/TrustSection";
import { PricingPanel } from "../components/features/PricingPanel";
import { FeatureCta } from "../components/features/FeatureCta";

export const FeaturesPage: React.FC = () => {
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
        <FeatureHero onGetStarted={handleStart} />
        <CapabilityCarousel />
        <PricingPanel />
        <TrustSection />
        <FeatureCta onGetStarted={handleStart} />
      </main>

      <SaraFooter />
    </div>
  );
};

export default FeaturesPage;
