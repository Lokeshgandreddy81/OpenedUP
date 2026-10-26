import React from "react";
import { ResultsView } from "../components/ResultsView";
import { useAppContext } from "../state/AppContext";

export interface ChatChaptersScreenProps {
  onClose?: () => void;
}

export const ChatChaptersScreen: React.FC<ChatChaptersScreenProps> = ({ onClose }) => {
  const {
    photos,
    engineOutput,
    readingPhase,
    failedBatches,
    handleRetryFailedBatches,
    handleUpdateRow,
    handleChangeCostCenter,
    handleAddFiles,
    handleNewPile,
  } = useAppContext();

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col bg-white">
      <ResultsView
        photos={photos}
        computedRows={engineOutput.computedRows}
        merchantTiles={engineOutput.merchantTiles}
        reconciliation={engineOutput.reconciliation}
        readingPhase={readingPhase}
        failedBatches={failedBatches}
        onRetryFailedBatches={handleRetryFailedBatches}
        onUpdateRow={handleUpdateRow}
        onChangeCostCenter={handleChangeCostCenter}
        onAddFiles={handleAddFiles}
        onNewPile={handleNewPile}
        onBack={onClose}
        isEmbedded={true}
      />
    </div>
  );
};

export default ChatChaptersScreen;
