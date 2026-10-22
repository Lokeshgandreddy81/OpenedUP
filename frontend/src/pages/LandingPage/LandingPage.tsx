import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LandingView } from "../../components/LandingView";
import { useAppContext } from "../../context/AppContext";
import { LandingPageErrorBoundary } from "./ErrorBoundary";

export const LandingPageContent: React.FC = () => {
  const navigate = useNavigate();
  const {
    photos,
    privacyAccepted,
    readingPhase,
    totalReceiptsFound,
    recentDiscoveries,
    failedBatches,
    connectedEmail,
    isDemo,
    handleAddFiles,
    handleRemovePhoto,
    setPrivacyAccepted,
    handleStartVisualise,
    handleRetryFailedBatches,
    setIsWorkspaceModalOpen,
  } = useAppContext();

  useEffect(() => {
    if (isDemo && typeof window !== "undefined" && window.location.pathname === "/") {
      navigate("/results" + window.location.search, { replace: true });
    }
  }, [isDemo, navigate]);

  return (
    <LandingView
      photos={photos}
      privacyAccepted={privacyAccepted}
      readingPhase={readingPhase}
      totalReceiptsFound={totalReceiptsFound}
      recentDiscoveries={recentDiscoveries}
      failedBatches={failedBatches}
      connectedEmail={connectedEmail}
      onAddFiles={handleAddFiles}
      onRemovePhoto={handleRemovePhoto}
      onTogglePrivacy={() => setPrivacyAccepted((v) => !v)}
      onStartVisualise={handleStartVisualise}
      onRetryFailedBatches={handleRetryFailedBatches}
      onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
    />
  );
};

export const LandingPage: React.FC = () => {
  return (
    <LandingPageErrorBoundary>
      <LandingPageContent />
    </LandingPageErrorBoundary>
  );
};

export default LandingPage;
