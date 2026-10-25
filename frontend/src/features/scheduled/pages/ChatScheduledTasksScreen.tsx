import React from "react";
import { ScheduledTasksView } from "../components/ScheduledTasksView";

export interface ScheduledTasksScreenProps {
  onClose: () => void;
  onNavigateToChat: (prompt?: string) => void;
  onNavigateToProviders: () => void;
  isEmbedded?: boolean;
}

export const ScheduledTasksScreen: React.FC<ScheduledTasksScreenProps> = ({
  onClose,
  onNavigateToChat,
  onNavigateToProviders,
  isEmbedded = true,
}) => (
  <ScheduledTasksView
    isOpen
    onClose={onClose}
    openedFromChat
    isEmbedded={isEmbedded}
    onNavigateToChat={onNavigateToChat}
    onNavigateToProviders={onNavigateToProviders}
  />
);

export default ScheduledTasksScreen;
