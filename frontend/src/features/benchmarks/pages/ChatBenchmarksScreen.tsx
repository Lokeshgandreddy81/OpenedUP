import React from "react";
import { BenchmarksView } from "../components/BenchmarksView";

export interface BenchmarksScreenProps {
  onClose?: () => void;
}

export const BenchmarksScreen: React.FC<BenchmarksScreenProps> = ({ onClose }) => (
  <div className="flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col">
    <BenchmarksView isOpen isEmbedded hideBackButton onClose={onClose} />
  </div>
);

export default BenchmarksScreen;
