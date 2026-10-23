import React, { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface PageRouteProps {
  name: string;
  fallback: ReactNode;
  children: ReactNode;
}

/** Keeps lazy chunk and render failures inside the route that owns the page. */
export function PageRoute({ name, fallback, children }: PageRouteProps) {
  return (
    <ErrorBoundary fallbackTitle={`${name} couldn't load`} onReset={() => window.location.reload()}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
