import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useChatAuth } from "../../../app/auth/useChatAuth";
import { safeInternalPath } from "../authCallback";

function signInErrorMessage(error: string): string {
  const message = error.toLowerCase();
  if (message.includes("not configured")) return error;
  if (message.includes("provider") && (message.includes("disabled") || message.includes("not enabled"))) {
    return "Google sign-in isn’t enabled in the Supabase project yet.";
  }
  if (message.includes("failed to fetch")) {
    return "Connection issue. Check your internet and try again.";
  }
  return "We couldn’t start Google sign-in. Please try again.";
}

const Brand: React.FC = () => (
  <Link
    to="/"
    className="group inline-flex items-center gap-2.5 no-underline transition-opacity hover:opacity-85"
    aria-label="Sara home"
  >
    <img
      src="/logos/brand-logo.png"
      alt=""
      className="h-9 w-9 shrink-0 object-contain transition-transform group-hover:scale-105"
    />
    <img src="/logos/sara.png" alt="Sara" className="h-[20px] w-auto object-contain brightness-0" />
  </Link>
);

const GoogleMark: React.FC = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectState = location.state as {
    from?: { pathname?: string; search?: string; hash?: string };
  } | null;
  const redirectTo = safeInternalPath(
    redirectState?.from?.pathname
      ? `${redirectState.from.pathname}${redirectState.from.search ?? ""}${redirectState.from.hash ?? ""}`
      : null
  );
  const { user, loading, signIn, signInError } = useChatAuth();
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true });
  }, [loading, navigate, redirectTo, user]);

  const handleGoogle = async () => {
    setGoogleSubmitting(true);
    await signIn();
    setGoogleSubmitting(false);
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#fbfcfe] px-4 py-12 text-slate-900 sm:px-6">
      <section className="w-full max-w-[360px] text-center">
        <div className="mb-7 flex flex-col items-center">
          <Brand />
          <h1 className="mt-6 text-[22px] font-semibold tracking-[-0.025em] text-neutral-900">
            Welcome to Sara
          </h1>
          <p className="mt-2 text-[13px] leading-5 text-neutral-500">
            Use your Google account to create an account or sign in.
          </p>
        </div>

        {signInError && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-rose-200/70 bg-rose-50/70 px-3.5 py-2.5 text-left text-[12px] leading-5 text-rose-700"
          >
            {signInErrorMessage(signInError)}
          </p>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleSubmitting || loading}
          className="flex h-[44px] w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200/90 bg-white text-[13.5px] font-medium text-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        >
          {googleSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : <GoogleMark />}
          <span>Continue with Google</span>
        </button>

        <p className="mt-5 text-[11px] leading-5 text-neutral-400">
          New here? Your account is created when you continue. Come back and use the same button to
          sign in.
        </p>

        <p className="mt-4 text-[11.5px] leading-relaxed text-neutral-400">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="text-neutral-600 underline hover:text-neutral-900 transition-colors">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-neutral-600 underline hover:text-neutral-900 transition-colors">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </main>
  );
};

export default AuthPage;
