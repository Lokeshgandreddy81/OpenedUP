import React from "react";
import { useNavigate } from "react-router-dom";
import { BenchmarksView } from "../../components/BenchmarksView";
import { BenchmarksPageErrorBoundary } from "./ErrorBoundary";

export const BenchmarksPageContent: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/results");
    }
  };

  return (
    <div className="w-screen h-screen">
      <BenchmarksView isOpen={true} onClose={handleClose} docTitle="AI Model Benchmarks" />
    </div>
  );
};

export const BenchmarksPage: React.FC = () => {
  return (
    <BenchmarksPageErrorBoundary>
      <BenchmarksPageContent />
    </BenchmarksPageErrorBoundary>
  );
};

export default BenchmarksPage;
