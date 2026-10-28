import React, { createContext } from "react";
import type { ReadingPhase } from "./types";
import type {
  FailedBatchInfo,
  ReceiptRow,
  UploadedPhoto,
  ReconciliationResult,
  MerchantTileData,
  ComputedRow,
} from "@charan-interiors/contracts";
import type { IngestedWorkspaceFile } from "../../../app/integrations/workspaceLiveSync";
import { computeShoeboxEngine } from "../services/engine";

export interface AppContextType {
  photos: UploadedPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<UploadedPhoto[]>>;
  rows: ReceiptRow[];
  setRows: React.Dispatch<React.SetStateAction<ReceiptRow[]>>;
  privacyAccepted: boolean;
  setPrivacyAccepted: React.Dispatch<React.SetStateAction<boolean>>;
  readingPhase: ReadingPhase;
  totalReceiptsFound: number;
  recentDiscoveries: Array<{ merchant: string; total: number | null; currency: string }>;
  failedBatches: FailedBatchInfo[];
  receiptModel: string;
  setReceiptModel: React.Dispatch<React.SetStateAction<string>>;
  duplicateReviewError: string | null;
  setDuplicateReviewError: React.Dispatch<React.SetStateAction<string | null>>;
  isWorkspaceModalOpen: boolean;
  setIsWorkspaceModalOpen: (open: boolean) => void;
  connectedEmail: string | null;
  setConnectedEmail: (email: string | null) => void;
  isDemo: boolean;
  isPdfDemo: boolean;
  engineOutput: {
    computedRows: ComputedRow[];
    merchantTiles: MerchantTileData[];
    reconciliation: ReconciliationResult;
  };
  handleAddFiles: (fileList: FileList | File[]) => void;
  handleIngestWorkspaceFiles: (items: IngestedWorkspaceFile[]) => void;
  handleRemovePhoto: (id: string) => void;
  handleStartVisualise: () => void;
  handleRetryFailedBatches: () => void;
  handleUpdateRow: (rowNumber: number, updater: (prev: ReceiptRow) => ReceiptRow) => void;
  handleChangeCostCenter: (rowId: string, newCostCenter: string) => void;
  handleNewPile: () => void;
}

declare global {
  interface Window {
    __SHOBOX_APP_CONTEXT__?: React.Context<AppContextType | null>;
    __SHOBOX_APP_CONTEXT_VALUE__?: AppContextType;
  }
}

export const AppContext: React.Context<AppContextType | null> =
  (typeof window !== "undefined" && window.__SHOBOX_APP_CONTEXT__) ||
  createContext<AppContextType | null>(null);

if (typeof window !== "undefined") {
  window.__SHOBOX_APP_CONTEXT__ = AppContext;
}

export const DEFAULT_APP_CONTEXT: AppContextType = {
  photos: [],
  setPhotos: () => {},
  rows: [],
  setRows: () => {},
  privacyAccepted: true,
  setPrivacyAccepted: () => {},
  readingPhase: "idle",
  totalReceiptsFound: 0,
  recentDiscoveries: [],
  failedBatches: [],
  receiptModel: "gemini-3.8-flash",
  setReceiptModel: () => {},
  duplicateReviewError: null,
  setDuplicateReviewError: () => {},
  isWorkspaceModalOpen: false,
  setIsWorkspaceModalOpen: () => {},
  connectedEmail: null,
  setConnectedEmail: () => {},
  isDemo: false,
  isPdfDemo: false,
  engineOutput: computeShoeboxEngine([], 1),
  handleAddFiles: () => {},
  handleIngestWorkspaceFiles: () => {},
  handleRemovePhoto: () => {},
  handleStartVisualise: () => {},
  handleRetryFailedBatches: () => {},
  handleUpdateRow: () => {},
  handleChangeCostCenter: () => {},
  handleNewPile: () => {},
};
