import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface SpringBootPageProps {
  onBack?: () => void;
}

export const SpringBootPage: React.FC<SpringBootPageProps> = ({ onBack }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/roadmap");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#FFFFFF] font-sans text-[#0F172A] animate-in fade-in duration-150 flex flex-col">
      {/* Top Header Navigation */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white/95 backdrop-blur-xs border-b border-slate-100">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-8 items-center gap-1.5 px-3 text-[12px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Roadmaps
        </button>
        <span className="text-[12px] font-medium text-slate-400 uppercase tracking-wider font-mono">
          Skill
        </span>
      </div>

      {/* Main Empty Clean Content */}
      <div className="mx-auto w-full max-w-[1440px] px-6 pb-24 pt-12 sm:pt-[4rem] flex-1 flex flex-col">
        <div className="flex items-center justify-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#0F172A] tracking-tight leading-tight text-center">
            Spring Boot
          </h1>
        </div>

        {/* Empty neat and clean content container */}
        <div className="mt-12 flex-1 min-h-[50vh]">
          {/* Roadmap content will be added here */}
        </div>
      </div>
    </div>
  );
};

export default SpringBootPage;
