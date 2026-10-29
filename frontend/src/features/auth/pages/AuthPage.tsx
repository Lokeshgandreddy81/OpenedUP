import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Sparkles,
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

const Brand: React.FC<{ inverse?: boolean }> = ({ inverse = false }) => (
  <Link
    to="/"
    className={`inline-flex items-center gap-2.5 no-underline ${inverse ? "text-white" : "text-slate-900"}`}
    aria-label="Openedup home"
  >
    <img
      src="/logos/brand-logo.png"
      alt=""
      className={`h-8 w-8 object-contain ${inverse ? "brightness-0 invert" : ""}`}
    />
    <span className="text-[18px] font-semibold tracking-[-0.04em]">Openedup</span>
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

const HeroPanel: React.FC = () => (
  <section className="relative isolate flex min-h-[300px] flex-col overflow-hidden bg-[#0d1b3d] px-6 py-6 text-white sm:px-10 sm:py-7 lg:min-h-screen lg:px-12 lg:py-10 xl:px-16 2xl:px-24">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        maskImage: "linear-gradient(135deg, black, transparent 78%)",
      }}
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-32 top-[14%] -z-10 h-[27rem] w-[27rem] rounded-full bg-blue-500/20 blur-[95px]"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-48 -left-28 -z-10 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-[110px]"
    />

    <Brand inverse />

    <div className="mx-auto flex w-full max-w-[570px] flex-1 flex-col justify-center py-6 lg:py-16">
      <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-[12px] font-medium text-blue-100 shadow-sm backdrop-blur-sm lg:mb-7">
        <Sparkles size={14} className="text-sky-300" />
        Documents, AI, and follow-through
      </div>
      <h1 className="max-w-[580px] font-serif text-[clamp(2.25rem,7vw,4.6rem)] leading-[1.02] tracking-[-0.055em] text-white lg:text-[clamp(2.6rem,5vw,4.6rem)] lg:leading-[0.99]">
        Make room for the work that matters.
      </h1>
      <p className="mt-4 max-w-[445px] text-[14px] leading-6 text-blue-100/75 sm:text-[15px] lg:mt-6 lg:text-[16px] lg:leading-7">
        Bring your documents, ideas, and next steps together. Openedup helps you move from a pile of
        information to clear progress.
      </p>

      <div className="mt-10 hidden max-w-[430px] rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-[0_24px_70px_rgba(0,0,0,.18)] backdrop-blur-md lg:block sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-200/65">
              Your workspace
            </p>
            <p className="mt-1.5 text-[17px] font-medium tracking-[-0.02em] text-white">
              A clearer way forward
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/20 bg-sky-300/10 text-sky-200">
            <ArrowRight size={19} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {[
            ["01", "Gather"],
            ["02", "Understand"],
            ["03", "Follow through"],
          ].map(([step, label], index) => (
            <div
              key={step}
              className="rounded-xl border border-white/[0.08] bg-black/10 px-3 py-3.5"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] text-sky-200/70">
                <span>{step}</span>
                {index < 2 && <span className="h-px flex-1 bg-white/15" />}
              </div>
              <p className="mt-2 text-[12px] font-medium leading-4 text-white/90">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="hidden items-center gap-2 text-[12px] text-blue-100/55 lg:flex">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />A thoughtful home for your work
    </div>
  </section>
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
    <main className="min-h-screen w-full overflow-y-auto bg-[#fbfcfe] text-slate-900 lg:grid lg:h-dvh lg:overflow-hidden lg:grid-cols-2">
      <HeroPanel />

      <section className="relative flex min-h-[620px] flex-col px-6 py-7 sm:px-10 lg:h-dvh lg:min-h-0 lg:overflow-y-auto lg:px-12 lg:py-8 xl:px-16">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Brand />
          </div>
          <p className="text-[13px] text-slate-500">
            {isCreateAccount ? "Already have an account?" : "New to Openedup?"}{" "}
            <Link
              className="font-semibold text-[#1746bf] underline decoration-transparent underline-offset-4 transition hover:decoration-current"
              to={isCreateAccount ? "/sign-in" : "/create-account"}
              state={location.state}
            >
              {isCreateAccount ? "Sign in" : "Create account"}
            </Link>
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12 lg:py-4">
          <div className="mb-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2858cb]">
              {isCreateAccount ? "Start here" : "Welcome back"}
            </p>
            <h2 className="font-serif text-[36px] leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-[40px]">
              {isCreateAccount ? "Create your account" : "Sign in to your workspace"}
            </h2>
            <p className="mt-3 text-[14px] leading-6 text-slate-500">
              {isCreateAccount
                ? "Set up your account and bring your work together."
                : "Pick up right where you left off."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleSubmitting || submitting}
            className="flex h-[49px] w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-[14px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            {googleSubmitting ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <GoogleMark />
            )}
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
              or with email
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isCreateAccount && (
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold text-slate-700">
                  Your name
                </span>
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={80}
                  placeholder="Alex Morgan"
                  className="h-[48px] w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-500 hover:border-slate-300 focus:border-[#3567df] focus:ring-4 focus:ring-blue-100/70"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold text-slate-700">
                Email address
              </span>
              <span className="relative block">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@example.com"
                  className="h-[48px] w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-500 hover:border-slate-300 focus:border-[#3567df] focus:ring-4 focus:ring-blue-100/70"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center justify-between text-[12px] font-semibold text-slate-700">
                <span>Password</span>
                {!isCreateAccount && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={submitting}
                    className="font-semibold text-[#2858cb] transition hover:text-[#183e9c] disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                )}
              </span>
              <span className="relative block">
                <LockKeyhole
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={isCreateAccount ? "new-password" : "current-password"}
                  aria-describedby={isCreateAccount ? "password-help" : undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={isCreateAccount ? 8 : undefined}
                  placeholder={isCreateAccount ? "At least 8 characters" : "Enter your password"}
                  className="h-[48px] w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-500 hover:border-slate-300 focus:border-[#3567df] focus:ring-4 focus:ring-blue-100/70"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {isCreateAccount && (
              <p
                id="password-help"
                className={`-mt-2 flex items-center gap-1.5 px-1 text-[12px] ${password.length >= 8 ? "text-emerald-700" : "text-slate-500"}`}
              >
                {password.length >= 8 && <Check aria-hidden="true" size={13} />}
                Use at least 8 characters.
              </p>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-[12px] leading-5 text-rose-700"
              >
                {error}
              </div>
            )}
            {notice && (
              <div
                role="status"
                className="flex gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[12px] leading-5 text-emerald-800"
              >
                <Check size={16} className="mt-0.5 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || googleSubmitting || loading}
              className="group mt-1 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#1746bf] px-5 text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(23,70,191,.18)] transition hover:bg-[#123b9f] hover:shadow-[0_10px_24px_rgba(23,70,191,.22)] disabled:cursor-wait disabled:opacity-60"
            >
              {submitting ? <LoaderCircle size={18} className="animate-spin" /> : null}
              {isCreateAccount ? "Create account" : "Sign in"}
              {!submitting && (
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              )}
            </button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <LockKeyhole size={13} /> Your account and information stay protected.
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} Openedup</span>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-slate-500 no-underline transition hover:text-slate-800"
          >
            Back to home <ArrowRight size={13} />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
