import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useChatAuth } from "../../../app/auth/useChatAuth";

type AuthMode = "sign-in" | "create-account";

interface AuthPageProps {
  mode: AuthMode;
}

function authErrorMessage(error: unknown): string {
  const message = typeof error === "string" ? error : error instanceof Error ? error.message : "";
  const code = (error as { code?: string } | null)?.code ?? "";
  switch (code) {
    case "email_exists":
    case "user_already_exists":
      return "An account with this email already exists. Try signing in instead.";
    case "invalid_email":
      return "Enter a valid email address.";
    case "invalid_credentials":
      return "That email and password combination doesn’t match an account.";
    case "weak_password":
      return "Choose a stronger password with at least 8 characters.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Wait a moment, then try again.";
    case "email_not_confirmed":
      return "Confirm your email address before signing in.";
    case "provider_disabled":
    case "unsupported_provider":
      return "Google sign-in isn’t enabled in your Supabase project yet.";
    default:
      if (message.toLowerCase().includes("not configured")) return message;
      if (message.toLowerCase().includes("failed to fetch")) {
        return "Connection issue. Check your internet and try again.";
      }
      if (message.toLowerCase().includes("provider is not enabled")) {
        return "Google sign-in isn’t enabled in your Supabase project yet.";
      }
      return "We couldn’t complete that request. Please try again.";
  }
}

function isEmailNotConfirmed(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "email_not_confirmed";
}

const Brand: React.FC = () => (
  <Link
    to="/"
    className="inline-flex items-center gap-2.5 no-underline text-slate-900"
    aria-label="Sara home"
  >
    <img
      src="/logos/brand-logo.png"
      alt=""
      className="h-10 w-10 shrink-0 object-contain"
    />
    <span className="text-[20px] font-semibold tracking-[-0.04em]">Sara</span>
  </Link>
);

const GoogleMark = () => (
  <svg aria-hidden="true" viewBox="0 0 48 48" className="h-[18px] w-[18px]">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
      transform="translate(0 4)"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.71 7.18l7.2 5.59c4.2-3.87 6.62-9.57 6.62-17.24Z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.97 23.97 0 0 0 0 21.56l7.98-6.19Z"
      transform="translate(0 4)"
    />
    <path
      fill="#34A853"
      d="M24 48c6.47 0 11.9-2.13 15.87-5.79l-7.2-5.59c-2 1.35-4.57 2.16-8.67 2.16-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
      transform="translate(0 -4)"
    />
  </svg>
);

export const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const isCreateAccount = mode === "create-account";
  const navigate = useNavigate();
  const location = useLocation();
  const redirectState = location.state as {
    from?: { pathname?: string; search?: string; hash?: string };
  } | null;
  const redirectTo = redirectState?.from?.pathname
    ? `${redirectState.from.pathname}${redirectState.from.search ?? ""}${redirectState.from.hash ?? ""}`
    : "/chat";
  const { user, loading, signIn, signInError, signInWithEmail, createAccount, sendPasswordReset } =
    useChatAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [accountCreationPending, setAccountCreationPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (user.emailVerified) {
      navigate(redirectTo, { replace: true });
    } else if (!accountCreationPending) {
      navigate("/verify-email", { replace: true, state: { from: redirectTo } });
    }
  }, [accountCreationPending, loading, navigate, redirectTo, user]);

  useEffect(() => {
    if (signInError) setError(authErrorMessage(signInError));
  }, [signInError]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (isCreateAccount && password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setAccountCreationPending(isCreateAccount);
    try {
      if (isCreateAccount) {
        const confirmationRequestAccepted = await createAccount(name, email, password);
        navigate("/verify-email", {
          replace: true,
          state: { from: redirectTo, confirmationRequestAccepted, email: email.trim() },
        });
        return;
      }
      try {
        await signInWithEmail(email, password);
      } catch (requestError) {
        if (isEmailNotConfirmed(requestError)) {
          navigate("/verify-email", {
            replace: true,
            state: { from: redirectTo, email, confirmationRequestAccepted: false },
          });
          return;
        }
        throw requestError;
      }
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(authErrorMessage(requestError));
    } finally {
      setSubmitting(false);
      setAccountCreationPending(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setNotice(null);
    setGoogleSubmitting(true);
    await signIn();
    setGoogleSubmitting(false);
  };

  const handleResetPassword = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your email address first, then choose forgot password.");
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setNotice("If an account exists for that email, a password reset link is on its way.");
    } catch (requestError) {
      setError(authErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#fbfcfe] px-4 py-8 text-slate-900 sm:px-6">
      <div className="w-full max-w-[380px] border border-transparent">
        <div className="mb-6 flex flex-col items-center text-center">
          <Brand />
          <h1 className="mt-4 font-serif text-[28px] tracking-tight text-slate-900">
            {isCreateAccount ? "Create account" : "Sign in"}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleSubmitting || submitting}
          className="flex h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-transparent bg-slate-100/80 text-[14px] font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
        >
          {googleSubmitting ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <GoogleMark />
          )}
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200/60" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            or
          </span>
          <span className="h-px flex-1 bg-slate-200/60" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isCreateAccount && (
            <div>
              <input
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={80}
                placeholder="Full name"
                className="h-[46px] w-full rounded-xl border border-transparent bg-slate-100/80 px-4 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-slate-100 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          <div>
            <div className="relative">
              <Mail
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="Email address"
                className="h-[46px] w-full rounded-xl border border-transparent bg-slate-100/80 pl-10 pr-4 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-slate-100 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <LockKeyhole
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={isCreateAccount ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={isCreateAccount ? 8 : undefined}
                placeholder={isCreateAccount ? "Password (min 8 characters)" : "Password"}
                className="h-[46px] w-full rounded-xl border border-transparent bg-slate-100/80 pl-10 pr-11 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-slate-100 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {!isCreateAccount && (
              <div className="mt-1.5 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={submitting}
                  className="text-[12px] text-slate-500 transition hover:text-slate-800 disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-transparent bg-rose-50 px-3.5 py-2.5 text-[12px] leading-5 text-rose-700"
            >
              {error}
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-transparent bg-emerald-50 px-3.5 py-2.5 text-[12px] leading-5 text-emerald-800"
            >
              <Check size={14} className="shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || googleSubmitting || loading}
            className="mt-2 flex h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-[#1746bf] px-5 text-[14px] font-medium text-white transition hover:bg-[#123b9f] disabled:cursor-wait disabled:opacity-60"
          >
            {submitting && <LoaderCircle size={16} className="animate-spin" />}
            {isCreateAccount ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-slate-500">
          {isCreateAccount ? "Already have an account?" : "Don't have an account?"}{" "}
          <Link
            className="font-medium text-[#1746bf] transition hover:underline"
            to={isCreateAccount ? "/sign-in" : "/create-account"}
            state={location.state}
          >
            {isCreateAccount ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </div>
    </main>
  );
};

export default AuthPage;
