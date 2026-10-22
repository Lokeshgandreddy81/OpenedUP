import React from "react";
import { useNavigate } from "react-router-dom";
import { ProjectsView } from "../../components/projects/ProjectsView";
import { ProjectsPageErrorBoundary } from "./ErrorBoundary";

export const ProjectsPageContent: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/results");
    }
  };

  return (
    <div className="w-screen h-screen">
      <ProjectsView onClose={handleClose} />
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
