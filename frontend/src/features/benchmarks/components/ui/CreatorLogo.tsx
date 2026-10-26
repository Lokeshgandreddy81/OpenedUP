import React, { useState } from "react";
import type { CreatorId } from "../types";
import { getCreatorColor, getCreatorName, resolveCreatorLogo } from "./creatorBranding";

export interface CreatorLogoProps {
  creator: CreatorId;
  size?: number;
  className?: string;
  showBackground?: boolean;
  title?: string;
}

/**
 * Renders official, authentic brand logos sourced directly from Artificial Analysis
 */
export const CreatorLogo: React.FC<CreatorLogoProps> = ({
  creator,
  size = 18,
  className = "",
  showBackground = false,
  title,
}) => {
  const [imgError, setImgError] = useState(false);
  const logoUrl = resolveCreatorLogo(creator as string);
  const label = title || getCreatorName(creator as string);
  const accentColor = getCreatorColor(creator as string);

  const renderContent = () => {
    if (logoUrl && !imgError) {
      return (
        <img
          src={logoUrl}
          alt={label}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="object-contain shrink-0 select-none"
          style={{ width: size, height: size, maxWidth: size, maxHeight: size }}
        />
      );
    }

    // High quality lettermark fallback if image fails to render
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: accentColor ? `${accentColor}18` : "#F1F5F9",
          color: accentColor || "#475569",
          borderColor: accentColor ? `${accentColor}35` : "#CBD5E1",
        }}
        className="rounded-full border flex items-center justify-center text-[10px] font-bold tracking-tight shrink-0 select-none"
        aria-label={label}
      >
        {(label || (creator as string) || "M").charAt(0).toUpperCase()}
      </div>
    );
  };

  if (showBackground) {
    return (
      <span
        style={{ width: size + 8, height: size + 8 }}
        className={`inline-flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200/80 shadow-xs shrink-0 ${className}`}
        title={label}
      >
        {renderContent()}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`} title={label}>
      {renderContent()}
    </span>
  );
};
