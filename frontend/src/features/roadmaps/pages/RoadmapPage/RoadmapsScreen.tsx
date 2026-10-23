import React from "react";
import { RoadmapExplorer } from "../../components/RoadmapExplorer";

export interface RoadmapsScreenProps {
  onBack: () => void;
}

export const RoadmapsScreen: React.FC<RoadmapsScreenProps> = ({ onBack }) => (
  <RoadmapExplorer onBack={onBack} />
);

export default RoadmapsScreen;
