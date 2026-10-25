import React from "react";
import { Navigate } from "react-router-dom";

export const ScheduledPage: React.FC = () => {
  return <Navigate to="/chat?view=scheduled" replace />;
};

export default ScheduledPage;
