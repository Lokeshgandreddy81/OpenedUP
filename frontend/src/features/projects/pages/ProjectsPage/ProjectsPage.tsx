import React from "react";
import { useNavigate } from "react-router-dom";
import { ProjectsScreen } from "./ProjectsScreen";
import { ProjectsPageErrorBoundary } from "./ErrorBoundary";

export const ProjectsPageContent: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="w-screen h-screen">
      <ProjectsScreen
        onOpenProviders={() => navigate("/chat?view=customize&category=Providers")}
        onOpenProjects={() => navigate("/projects")}
        onOpenPlugins={() => navigate("/chat?view=plugins")}
        onOpenBenchmarks={() => navigate("/chat?view=benchmarks")}
        onOpenArtifacts={() => navigate("/chat?view=artifacts")}
      />
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
