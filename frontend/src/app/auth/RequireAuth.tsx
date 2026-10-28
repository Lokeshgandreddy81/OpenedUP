import React from "react";
import { LoaderCircle } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useChatAuth } from "./useChatAuth";

export const RequireAuth: React.FC = () => {
  const { user, loading } = useChatAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfcfe] text-slate-500">
        <LoaderCircle aria-label="Checking your session" className="animate-spin" size={22} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (!user.emailVerified) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
