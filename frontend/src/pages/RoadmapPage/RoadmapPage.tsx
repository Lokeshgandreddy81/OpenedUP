import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoadmapCanvas } from "../../components/RoadmapCanvas";
import { useAppContext } from "../../context/AppContext";
import { RoadmapPageErrorBoundary } from "./ErrorBoundary";

export const RoadmapPageContent: React.FC = () => {
  const navigate = useNavigate();
  const { engineOutput } = useAppContext();
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/results");
    }
  };

  return (
    <div className="w-screen h-screen bg-white">
      <RoadmapCanvas
        isOpen={true}
        onClose={handleClose}
        chapters={engineOutput.computedRows}
        selectedRow={selectedRow}
        onSelectChapter={(rowNum) => setSelectedRow(rowNum)}
        docTitle="Document Roadmap"
        mode="modal"
      />
    </div>
  );
};

export const RoadmapPage: React.FC = () => {
  return (
    <RoadmapPageErrorBoundary>
      <RoadmapPageContent />
    </RoadmapPageErrorBoundary>
  );
};

export default RoadmapPage;
