import { createRoot } from "react-dom/client";
import "./index.css";
import {
  SafetyRefusalChartCard,
  type SafetyRefusalChartCardProps,
} from "./components/benchmarks/coding/SafetyRefusalChartCard";

const TAB_IDS: SafetyRefusalChartCardProps["initialTab"][] = [
  "index",
  "deepSwe",
  "terminalBench",
  "sweAtlas",
];

const requestedTab = new URLSearchParams(window.location.search).get("tab");
const initialTab = TAB_IDS.find((tabId) => tabId === requestedTab);

createRoot(document.getElementById("root")!).render(
  <div className="min-h-screen bg-white px-2 sm:px-6 pt-10">
    <SafetyRefusalChartCard initialTab={initialTab ?? "index"} />
  </div>
);
