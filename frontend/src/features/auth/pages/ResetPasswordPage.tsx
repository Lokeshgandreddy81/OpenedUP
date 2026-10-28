import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useChatAuth } from "../../../app/auth/useChatAuth";
import { updateChatPassword } from "../../../app/integrations/supabaseAuth";

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useChatAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/sign-in", { replace: true });
  }, [loading, navigate, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords don’t match.");
      return;
    }

    setSubmitting(true);
    try {
      await updateChatPassword(password);
      navigate("/chat", { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "We couldn’t update your password. Request a new reset link and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfcfe] text-slate-500">
        <LoaderCircle aria-label="Checking your reset link" className="animate-spin" size={22} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_15%_15%,#e5efff,transparent_34%),linear-gradient(135deg,#f7f9fd,#fff)] px-5 py-10 text-slate-900">
      <section className="w-full max-w-[460px] rounded-[26px] border border-slate-200/80 bg-white/90 p-7 shadow-[0_24px_80px_rgba(23,47,94,.10)] backdrop-blur sm:p-10">
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1746bf]">
          <LockKeyhole size={25} strokeWidth={1.8} />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2858cb]">
          Account security
        </p>
        <h1 className="mt-3 font-serif text-[34px] leading-tight tracking-[-0.045em] text-slate-950">
          Choose a new password
        </h1>
        <p className="mt-3 text-[14px] leading-6 text-slate-600">
          Set a new password for {user.email || "your account"}.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold text-slate-700">
              New password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-[#3567df] focus:ring-4 focus:ring-blue-100/70"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold text-slate-700">
              Confirm new password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
              minLength={8}
              placeholder="Enter it again"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-[#3567df] focus:ring-4 focus:ring-blue-100/70"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] leading-5 text-rose-700"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#1746bf] px-5 text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(23,70,191,.18)] transition hover:bg-[#123b9f] disabled:cursor-wait disabled:opacity-60"
          >
            {submitting && <LoaderCircle size={18} className="animate-spin" />}
            Update password
          </button>
        </form>
        <Link
          to="/sign-in"
          className="mt-6 inline-flex text-[13px] font-semibold text-[#2858cb] no-underline hover:text-[#183e9c]"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
};

export default ResetPasswordPage;
