import React from "react";
import { ProjectsScreen } from "./ProjectsScreen";
import { ProjectsPageErrorBoundary } from "./ErrorBoundary";

export const ProjectsPageContent: React.FC = () => {
  return (
    <div className="w-screen h-screen">
      <ProjectsScreen />
    </div>
  );
};

export const ProjectsPage: React.FC = () => {
  return (
    <ProjectsPageErrorBoundary>
      <ProjectsPageContent />
    </ProjectsPageErrorBoundary>
  );
};

export default ProjectsPage;
