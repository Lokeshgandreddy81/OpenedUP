import React from "react";
import { ScheduledTasksView } from "../components/ScheduledTasksView";

export interface ScheduledTasksScreenProps {
  onClose: () => void;
  onNavigateToChat: (prompt?: string) => void;
}

export const ScheduledTasksScreen: React.FC<ScheduledTasksScreenProps> = ({
  onClose,
  onNavigateToChat,
}) => (
  <ScheduledTasksView isOpen onClose={onClose} openedFromChat onNavigateToChat={onNavigateToChat} />
);

export default ScheduledTasksScreen;
