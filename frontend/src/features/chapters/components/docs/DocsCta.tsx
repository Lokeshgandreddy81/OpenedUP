import React from "react";

export const DocsCta: React.FC = () => {
  return (
    <nav
      aria-label="More documentation"
      className="flex flex-wrap gap-x-5 gap-y-2 border-t border-neutral-200/80 pt-5 text-[13px] font-medium text-neutral-500"
    >
      <a
        href="https://github.com/Lokeshgandreddy81/OpenedUP"
        target="_blank"
        rel="noreferrer"
        className="transition-colors hover:text-neutral-950"
      >
        GitHub
      </a>
      <a
        href="https://github.com/Lokeshgandreddy81/OpenedUP/blob/main/packages/docs/api/openapi.yaml"
        target="_blank"
        rel="noreferrer"
        className="transition-colors hover:text-neutral-950"
      >
        OpenAPI specification
      </a>
      <a
        href="https://github.com/Lokeshgandreddy81/OpenedUP/issues"
        target="_blank"
        rel="noreferrer"
        className="transition-colors hover:text-neutral-950"
      >
        Report an issue
      </a>
    </nav>
  );
};
