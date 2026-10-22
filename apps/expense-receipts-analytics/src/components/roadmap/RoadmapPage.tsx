import React from "react";
import { ArrowLeft } from "lucide-react";

export interface RoadmapPageRoadmap {
  id: string;
  title: string;
}

const ROADMAP_PAGE_CONTENT: Record<string, React.ReactNode> = {};

interface RoadmapPageProps {
  roadmap: RoadmapPageRoadmap;
  onBack: () => void;
}

export const RoadmapPage: React.FC<RoadmapPageProps> = ({ roadmap, onBack }) => {
  return (
    <div className="explore-screen fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#FFFFFF] font-sans text-[#0F172A] animate-in fade-in duration-150">
      <button
        type="button"
        onClick={onBack}
        className="fixed left-4 top-4 z-20 inline-flex h-8 items-center gap-1.5 px-3 text-[12px] font-medium text-[#0F172A] cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="mx-auto w-full max-w-[1440px] px-6 pb-24 pt-24 sm:pt-[6rem]">
        <div className="flex items-center justify-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#0F172A] tracking-tight leading-tight">
            {roadmap.title}
          </h1>
        </div>

        <div className="mt-12 min-h-[50vh]">{ROADMAP_PAGE_CONTENT[roadmap.id] ?? null}</div>
      </div>
    </div>
  );
};
