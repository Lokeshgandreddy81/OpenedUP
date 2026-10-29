import React, { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChatAuth } from "../../../app/auth/useChatAuth";
import { callbackError, safeInternalPath } from "../authCallback";

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useChatAuth();
  const params = new URLSearchParams(location.search);
  const redirectTo = safeInternalPath(params.get("next"));
  const providerError = callbackError(location.search, location.hash);

  useEffect(() => {
    if (loading || providerError) return;
    if (!user) {
      navigate("/sign-in", { replace: true, state: { from: redirectTo } });
    } else if (user.emailVerified) {
      navigate(redirectTo, { replace: true });
    } else {
      navigate("/verify-email", { replace: true, state: { from: redirectTo, email: user.email } });
    }
  }, [loading, navigate, providerError, redirectTo, user]);

  if (providerError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfcfe] px-6 text-center">
        <section className="max-w-md">
          <h1 className="font-serif text-3xl text-slate-950">Sign-in didn’t finish</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {providerError.replaceAll("+", " ")}
          </p>
          <Link className="mt-6 inline-flex font-semibold text-[#1746bf]" to="/sign-in">
            Return to sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfcfe] text-slate-500">
      <LoaderCircle aria-label="Finishing sign-in" className="animate-spin" size={22} />
    </main>
  );
};

export default AuthCallbackPage;
