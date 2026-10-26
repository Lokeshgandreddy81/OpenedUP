import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LandingView } from "../../components/LandingView";
import { useAppContext } from "../../state/useAppContext";
import { LandingPageErrorBoundary } from "./ErrorBoundary";

export const LandingPageContent: React.FC = () => {
  const navigate = useNavigate();
  const { isDemo, receiptModel, setReceiptModel } = useAppContext();

  useEffect(() => {
    if (isDemo && typeof window !== "undefined" && window.location.pathname === "/") {
      navigate("/results" + window.location.search, { replace: true });
    }
  }, [isDemo, navigate]);

  const handleGetStarted = () => {
    navigate("/chat");
  };

  return (
    <LandingView
      onGetStarted={handleGetStarted}
      receiptModel={receiptModel}
      onReceiptModelChange={setReceiptModel}
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
