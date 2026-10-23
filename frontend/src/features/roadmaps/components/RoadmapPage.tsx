import React, { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { RoadmapCanvas } from "./RoadmapCanvas";
import { getCatalogRoadmapChapters } from "../data/catalogRoadmaps";

export interface RoadmapPageRoadmap {
  id: string;
  title: string;
}

interface RoadmapPageProps {
  roadmap: RoadmapPageRoadmap;
  onBack: () => void;
}

export const RoadmapPage: React.FC<RoadmapPageProps> = ({ roadmap, onBack }) => {
  const chapters = useMemo(
    () => getCatalogRoadmapChapters(roadmap.id, roadmap.title),
    [roadmap.id, roadmap.title]
  );

  return (
    <div className="explore-screen fixed inset-0 z-[60] bg-[#FFFFFF] font-sans text-[#0F172A] animate-in fade-in duration-150 flex flex-col">
      {/* Top Navigation Bar with Back Button */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white/95 backdrop-blur-xs ">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 items-center gap-1.5 px-3 text-[12px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wider font-mono">
          Interactive Node Roadmap
        </span>
      </div>

      {/* Embedded Native RoadmapCanvas with Full Node System */}
      <div className="flex-1 w-full h-[calc(100vh-48px)] overflow-hidden">
        <RoadmapCanvas
          isOpen={true}
          onClose={onBack}
          chapters={chapters}
          docTitle={`${roadmap.title} Roadmap`}
          mode="docked"
          showExploreButton={false}
          onSelectChapter={() => {}}
        />
      </div>
    </div>
  );
};

export default RoadmapPage;
