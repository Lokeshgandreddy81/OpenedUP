import React from "react";
import { useNavigate } from "react-router-dom";
import { BenchmarksView } from "../../components/BenchmarksView";
import { BenchmarksPageErrorBoundary } from "./ErrorBoundary";

export const BenchmarksPageContent: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const search = window.location.search;
    const dest = search
      ? `/chat?view=benchmarks&${search.replace(/^\?/, "").replace(/view=[^&]*&?/, "")}`
      : "/chat?view=benchmarks";
    navigate(dest, { replace: true });
  }, [navigate]);

  return (
    <div className="w-screen h-screen">
      <BenchmarksView isOpen={true} isEmbedded={true} hideBackButton={true} />
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
