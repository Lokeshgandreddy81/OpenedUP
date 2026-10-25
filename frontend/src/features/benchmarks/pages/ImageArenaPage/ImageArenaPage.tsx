import React from "react";
import { useNavigate } from "react-router-dom";
import { ImageArenaView } from "../../components/multimodal/ImageArenaView";
import { ImageArenaPageErrorBoundary } from "./ErrorBoundary";

export const ImageArenaPageContent: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/chat?view=benchmarks&tab=multimodal");
  };

  return (
    <div className="w-screen h-screen">
      <ImageArenaView onBackToOverview={handleBack} />
    </div>
  );
};

export const ImageArenaPage: React.FC = () => {
  return (
    <ImageArenaPageErrorBoundary>
      <ImageArenaPageContent />
    </ImageArenaPageErrorBoundary>
  );
};

export default ImageArenaPage;
