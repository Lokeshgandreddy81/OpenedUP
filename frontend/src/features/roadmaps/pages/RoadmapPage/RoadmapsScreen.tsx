import React from "react";
import { RoadmapExplorer } from "../../components/RoadmapExplorer";

export interface RoadmapsScreenProps {
  onBack?: () => void;
  isEmbedded?: boolean;
}

export const RoadmapsScreen: React.FC<RoadmapsScreenProps> = ({
  onBack = () => {},
  isEmbedded = true,
}) => (
  <div className="flex-1 w-full h-full min-w-0 overflow-hidden flex flex-col">
    <RoadmapExplorer onBack={onBack} isEmbedded={isEmbedded} />
  </div>
);

export default RoadmapsScreen;
