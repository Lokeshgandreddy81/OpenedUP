import React from "react";
import { RoadmapExplorer } from "../../components/RoadmapExplorer";

export interface RoadmapsScreenProps {
  onBack?: () => void;
  isEmbedded?: boolean;
}

export const RoadmapsScreen: React.FC<RoadmapsScreenProps> = ({
  onBack = () => {},
  isEmbedded = true,
}) => <RoadmapExplorer onBack={onBack} isEmbedded={isEmbedded} />;

export default RoadmapsScreen;
