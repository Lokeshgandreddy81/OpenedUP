import React from "react";
import { ScheduledTasksView } from "../components/ScheduledTasksView";

export interface ScheduledTasksScreenProps {
  onClose: () => void;
  onNavigateToChat: (prompt?: string) => void;
  onNavigateToProviders: () => void;
}

export const ScheduledTasksScreen: React.FC<ScheduledTasksScreenProps> = ({
  onClose,
  onNavigateToChat,
  onNavigateToProviders,
}) => (
  <ScheduledTasksView
    isOpen
    onClose={onClose}
    openedFromChat
    onNavigateToChat={onNavigateToChat}
    onNavigateToProviders={onNavigateToProviders}
  />
);

export default ScheduledTasksScreen;
