import React from "react";
import { Check, GitMerge, GitPullRequest, Mic, ShieldCheck } from "lucide-react";
import { ChatGPTLogo } from "./LandingNavbar";

export const LandingCodeReview: React.FC = () => (
  <div className="mt-24 sm:mt-32 grid grid-cols-1 lg:grid-cols-[270px_1fr] xl:grid-cols-[290px_1fr] gap-8 lg:gap-16 xl:gap-24 items-end">
    <div className="max-w-[290px] lg:self-end lg:translate-x-4 lg:pb-3">
      <h3
        className="text-[30px] sm:text-[36px] md:text-[40px] font-normal sm:font-medium tracking-[-0.03em] text-neutral-950 leading-[1.14]"
        style={{ fontWeight: 500 }}
      >
        Scale code review
        <br className="hidden sm:inline" /> confidently
      </h3>
      <p className="mt-6 text-[14px] sm:text-[15px] text-neutral-600 leading-[1.65] max-w-[280px]">
        Ship code faster without sacrificing quality. Sara automatically reviews pull requests in
        context — verifying concurrency locks, catching regression risks, and validating test
        coverage so your team merges production-ready code with complete confidence.
      </p>
    </div>

    <div
      className="relative w-full lg:w-[93%] lg:ml-auto min-h-[520px] sm:min-h-0 sm:aspect-[488/312] rounded-[8px] sm:rounded-[10px] overflow-hidden select-none shadow-[0_20px_50px_rgba(47,145,253,0.25),0_6px_16px_rgba(47,145,253,0.12)]"
      style={{
        background:
          "linear-gradient(135deg, #2f91fd 0%, #3d93fe 25%, #62a2fc 60%, #8eaefd 85%, #9ebefd 100%)",
      }}
    >
      <div
        className="absolute left-[6.5%] sm:left-[7%] top-[12%] sm:top-[13%] right-0 bottom-0 rounded-tl-[12px] sm:rounded-tl-[16px] border-t border-l border-black/[0.08] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 98%)",
          maskImage: "linear-gradient(to bottom, black 65%, transparent 98%)",
        }}
      >
        <div className="flex h-10 sm:h-11 shrink-0 items-center justify-between border-b border-neutral-200/70 bg-[#fafafa]/95 px-4 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-neutral-200/70 px-2.5 py-1 text-[11px] font-semibold text-neutral-900">
              Summary
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-neutral-600">
              Changes <span className="font-mono text-emerald-600 font-semibold">+1,228</span>{" "}
              <span className="font-mono text-rose-500 font-semibold">-88</span>
            </span>
          </div>
          <button className="flex items-center gap-1.5 rounded-full bg-[#1b1c1e] hover:bg-black text-white px-3 py-1 text-[10.5px] font-medium shadow-xs transition-colors">
            <GitMerge className="h-3 w-3" />
            <span>Merge</span>
          </button>
        </div>
        <div className="flex-1 p-4 sm:p-5 overflow-hidden flex gap-6 text-[10.5px] sm:text-[11px]">
          <div className="w-[52%] sm:w-[50%] shrink-0 space-y-3">
            <div>
              <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-0.5 text-[9.5px] font-medium text-neutral-700 border border-neutral-200/80">
                <GitPullRequest className="h-2.5 w-2.5 text-neutral-600" /> Open
              </span>
              <h4 className="mt-1.5 text-[14px] sm:text-[15.5px] font-semibold text-neutral-950 tracking-tight leading-snug">
                Prevent duplicate checkout orders
              </h4>
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-neutral-400">
                <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-bold text-[7.5px] flex items-center justify-center">
                  J
                </div>
                <span className="font-medium text-neutral-700">joeytrasatti</span>
                <span>·</span>
                <span>Aug 23</span>
              </div>
            </div>

            <div>
              <div className="font-semibold text-neutral-900 text-[10.5px] mb-1">Summary</div>
              <p className="text-neutral-600 text-[10px] sm:text-[10.5px] leading-relaxed">
                Double-clicks and retries can create duplicate orders. Reuse the pending order
                before starting payment.
              </p>
              <ul className="mt-1.5 space-y-0.5 text-[9.5px] sm:text-[10px] text-neutral-600 list-disc list-inside">
                <li>Lock order creation for each shopper.</li>
                <li>Reuse the pending order when a request retries.</li>
                <li>Cover classic checkout and the Checkout block.</li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-neutral-900 text-[10.5px] mb-1">Test plan</div>
              <p className="text-neutral-500 text-[9.5px] sm:text-[10px] leading-relaxed">
                Submit checkout twice at once and retry after a timeout. Confirm one order is
                created and normal checkout works.
              </p>
            </div>

            <div className="flex items-center gap-1.5 pt-1 text-[10px]">
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">👍 4</span>
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">🚀 2</span>
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">🎉 1</span>
            </div>
          </div>
          <div className="flex-1 space-y-3 pt-0.5">
            <div>
              <span className="font-semibold text-[10px] text-neutral-400 uppercase tracking-wider">
                Comments
              </span>
              <div className="mt-1.5 flex items-center gap-1.5 text-neutral-600 text-[10px] truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="truncate">Refresh the pending order after ac...</span>
              </div>
            </div>
            <div>
              <span className="font-semibold text-[10px] text-neutral-400 uppercase tracking-wider">
                Reviews
              </span>
              <div className="mt-1.5 flex items-center gap-1.5 text-neutral-500 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 shrink-0" />
                <span>Sara code review pass</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-[5%] sm:right-[6%] bottom-[7%] sm:bottom-[8%] w-[58%] sm:w-[54%] rounded-xl sm:rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_50px_rgba(15,23,42,0.18),0_4px_16px_rgba(15,23,42,0.06)] overflow-hidden flex flex-col justify-between p-3.5 sm:p-4.5 z-20 text-[10.5px] sm:text-[11px]">
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <ChatGPTLogo className="h-4.5 w-4.5 text-neutral-900 shrink-0" />
            <span className="font-semibold text-neutral-950 text-[11.5px] sm:text-[12px] tracking-tight">
              Sara Code Review
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100/90 px-2.5 py-0.5 text-[9.5px] font-medium text-neutral-800 border border-neutral-200/80">
            <Check className="h-2.5 w-2.5 text-emerald-600 stroke-[2.5]" /> Ready to merge
          </span>
        </div>
        <div className="py-2.5 space-y-2.5">
          <p className="text-neutral-700 text-[10px] sm:text-[10.5px] leading-relaxed">
            Audited 14 modified files across checkout pipeline. Concurrency locks & idempotency
            verified.
          </p>
          <div className="space-y-1.5">
            <div className="rounded-lg bg-neutral-50 border border-neutral-200/70 p-2 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900 text-[10px] flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-[#2f91fd]" /> Idempotency check
                </span>
                <span className="text-[9px] text-neutral-400 font-mono">order_lock.ts</span>
              </div>
              <p className="text-neutral-500 text-[9.5px] leading-normal">
                Lock acquisition verified with 5s Redis timeout. No deadlock path found.
              </p>
            </div>

            <div className="rounded-lg bg-neutral-50 border border-neutral-200/70 p-2 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900 text-[10px] flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-600" /> Test coverage pass
                </span>
                <span className="text-[9px] text-emerald-600 font-mono font-medium">+14 tests</span>
              </div>
              <p className="text-neutral-500 text-[9.5px] leading-normal">
                Retries and double-clicks covered across classic and API checkout blocks.
              </p>
            </div>
          </div>
        </div>
        <div className="pt-1">
          <div className="flex items-center justify-between rounded-full border border-neutral-200/90 bg-[#f9f9fa] px-3 py-1.5 text-[10px] sm:text-[10.5px] text-neutral-500 shadow-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-neutral-400 font-medium text-xs leading-none">+</span>
              <span className="truncate">Ask Sara about edge cases...</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-400 shrink-0 ml-1">
              <Mic className="h-3 w-3 cursor-pointer hover:text-neutral-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
