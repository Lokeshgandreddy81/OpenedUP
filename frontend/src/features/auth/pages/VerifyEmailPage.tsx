import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, LoaderCircle, LogOut, MailCheck, RefreshCw } from "lucide-react";
import { useChatAuth } from "../../../app/auth/useChatAuth";

interface VerifyEmailRouteState {
  from?: string | { pathname?: string; search?: string; hash?: string };
  email?: string;
  confirmationRequestAccepted?: boolean;
}

function resendErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
    return "Too many confirmation emails were requested. Wait a few minutes before trying again.";
  }
  if (error instanceof Error && error.message.toLowerCase().includes("failed to fetch")) {
    return "We couldn’t reach Supabase. Check your connection, then try again.";
  }
  return "We couldn’t request another confirmation email. Please try again in a moment.";
}

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, refreshUser, resendVerificationEmail, signOut } = useChatAuth();
  const routeState = location.state as VerifyEmailRouteState | null;
  const email = user?.email || routeState?.email || null;
  const from = routeState?.from;
  const redirectTo =
    typeof from === "string"
      ? from
      : from?.pathname
        ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
        : "/chat";
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirmationRequestAccepted, setConfirmationRequestAccepted] = useState(
    routeState?.confirmationRequestAccepted ?? null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user && !email) {
      navigate("/sign-in", { replace: true, state: { from: redirectTo } });
    } else if (user?.emailVerified) {
      navigate(redirectTo, { replace: true });
    }
  }, [email, loading, navigate, redirectTo, user]);

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await resendVerificationEmail(email);
      setConfirmationRequestAccepted(true);
    } catch (requestError) {
      setConfirmationRequestAccepted(false);
      setError(resendErrorMessage(requestError));
    } finally {
      setResending(false);
    }
  };

  const handleCheck = async () => {
    setError(null);
    setChecking(true);
    try {
      const refreshedUser = await refreshUser();
      if (refreshedUser?.emailVerified) {
        navigate(redirectTo, { replace: true });
      } else if (!refreshedUser) {
        setError("Confirmation checked. Sign in after opening the link in your email to continue.");
      } else {
        setError("Your email isn’t verified yet. Open the link in your inbox, then check again.");
      }
    } catch {
      setError("We couldn’t check your verification yet. Try again in a moment.");
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/sign-in", { replace: true, state: { from: redirectTo } });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_15%_15%,#e5efff,transparent_34%),linear-gradient(135deg,#f7f9fd,#fff)] px-5 py-10 text-slate-900">
      <section className="w-full max-w-[470px] rounded-[26px] border border-slate-200/80 bg-white/90 p-7 shadow-[0_24px_80px_rgba(23,47,94,.10)] backdrop-blur sm:p-10">
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1746bf]">
          <MailCheck size={27} strokeWidth={1.8} />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2858cb]">
          One quick step
        </p>
        <h1 className="mt-3 font-serif text-[34px] leading-tight tracking-[-0.045em] text-slate-950">
          Verify your email
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-slate-600">
          {confirmationRequestAccepted === true
            ? "Confirmation requested for"
            : "Confirm this email address:"}{" "}
          <span className="font-semibold text-slate-800">{email || "your email address"}</span>.
          Open the confirmation email and follow its link to finish setting up your account. The link
          returns you here and signs you in. If you opened it on another device, come back here and
          sign in with this address.
        </p>

        {confirmationRequestAccepted === false && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-800"
          >
            We couldn’t confirm that a new email was sent. The address may already be confirmed or
            a request may be rate limited. Check your inbox first; if needed, wait briefly and
            request another link below.
          </p>
        )}
        {confirmationRequestAccepted === true && (
          <p
            role="status"
            className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] leading-5 text-emerald-800"
          >
            <Check size={15} className="mt-0.5 shrink-0" />
            Supabase accepted the confirmation request. Delivery can take a few minutes, and this
            page can’t confirm that it reached your inbox. Check spam or promotions too. If it
            doesn’t arrive, request another link below.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] leading-5 text-rose-700"
          >
            {error}
          </p>
        )}

        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={handleCheck}
            disabled={checking || resending || loading}
            className="flex h-[49px] w-full items-center justify-center gap-2 rounded-xl bg-[#1746bf] px-5 text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(23,70,191,.18)] transition hover:bg-[#123b9f] disabled:cursor-wait disabled:opacity-60"
          >
            {checking ? <LoaderCircle size={18} className="animate-spin" /> : <Check size={17} />}
            I’ve verified my email
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={checking || resending || loading || !email}
            className="flex h-[47px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            {resending ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Resend verification email
          </button>
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5 text-[12px]">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="inline-flex items-center gap-1.5 font-medium text-slate-500 transition hover:text-slate-800"
          >
            <LogOut size={14} /> Use another account
          </button>
          <Link
            to="/"
            className="font-medium text-slate-500 no-underline transition hover:text-slate-800"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
};

export default VerifyEmailPage;
