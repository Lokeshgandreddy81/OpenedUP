import { createRoot } from "react-dom/client";
import "./index.css";
import { LLMLeaderboardView } from "./components/benchmarks/leaderboard/LLMLeaderboardView";
import { BENCHMARK_MODELS } from "./components/benchmarks/data/benchmarkModels";

createRoot(document.getElementById("root")!).render(
  <div className="min-h-screen bg-white">
    <LLMLeaderboardView models={BENCHMARK_MODELS} />
  </div>
);
