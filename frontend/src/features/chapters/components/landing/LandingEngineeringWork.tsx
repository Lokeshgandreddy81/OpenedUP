import React from "react";
import { ChevronRight } from "lucide-react";

export const LandingEngineeringWork: React.FC = () => (
  <div className="mt-16 sm:mt-24 grid grid-cols-1 lg:grid-cols-[270px_1fr] xl:grid-cols-[290px_1fr] gap-8 lg:gap-16 xl:gap-24 items-end">
    <div className="max-w-[290px] lg:self-end lg:translate-x-4 lg:pb-3">
      <h3
        className="text-[30px] sm:text-[36px] md:text-[40px] font-normal sm:font-medium tracking-[-0.03em] text-neutral-950 leading-[1.14]"
        style={{ fontWeight: 500 }}
      >
        Built to drive real
        <br className="hidden sm:inline" /> engineering work
      </h3>
      <p className="mt-6 text-[14px] sm:text-[15px] text-neutral-600 leading-[1.65] max-w-[280px]">
        Give Sara your toughest engineering problems, from hard-to-find bugs to complex refactors
        and new features. Sara works efficiently and autonomously across your codebase, delivering
        verified, high-quality results with speed and precision.
      </p>
    </div>

    <div
      className="relative w-full lg:w-[93%] lg:ml-auto min-h-[520px] sm:min-h-0 sm:aspect-[488/312] rounded-[8px] sm:rounded-[10px] overflow-hidden select-none shadow-[0_20px_50px_rgba(47,145,253,0.25),0_6px_16px_rgba(47,145,253,0.12)]"
      style={{
        background:
          "linear-gradient(135deg, #2f91fd 0%, #3d93fe 25%, #62a2fc 60%, #8eaefd 85%, #9ebefd 100%)",
      }}
    >
      <div className="absolute left-[7%] top-[9.5%] w-[62%] h-[84%] rounded-[6px] sm:rounded-[8px] border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden text-[10px] sm:text-[11px] md:text-[11.5px] font-mono leading-[1.55] [mask-image:linear-gradient(to_bottom,black_82%,transparent)]">
        <div className="flex h-8 sm:h-9 items-center justify-between border-b border-neutral-100 px-3 sm:px-3.5 bg-white/95">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10.5px] sm:text-[11px] text-neutral-700 font-medium">
              Unstaged changes
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-medium text-emerald-600">+28</span>
            <span className="text-[9.5px] sm:text-[10px] font-medium text-rose-500">-14</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[9.5px] sm:text-[10px] text-neutral-600">
              <span>&lt;&gt; Commit</span>
              <span className="text-[8.5px]">▾</span>
            </div>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-neutral-400"
            >
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </div>
        </div>
        <div className="border-b border-neutral-100 bg-neutral-50/70 px-3 sm:px-3.5 py-1 text-[9.5px] sm:text-[10px] text-neutral-500 flex items-center gap-1.5">
          <span>src/features/sara/renderEngine.ts</span>
          <span className="text-emerald-600">+28</span>
          <span className="text-rose-500">-14</span>
        </div>
        <div className="p-2 sm:p-2.5 font-mono space-y-0.5 select-text overflow-hidden">
          <div className="text-neutral-400">
            <span className="inline-block w-6 text-neutral-300">36</span>
            <span className="text-neutral-800">const dpr = window.devicePixelRatio || 1;</span>
          </div>
          <div className="text-neutral-400">
            <span className="inline-block w-6 text-neutral-300">37</span>
            <span className="text-neutral-800">
              const rect = containerRef.current?.getBoundingClientRect();
            </span>
          </div>
          <div className="text-neutral-400">
            <span className="inline-block w-6 text-neutral-300">38</span>
            <span className="text-neutral-800">const logicalW = rect?.width ?? 800;</span>
          </div>
          <div className="text-neutral-300">
            <span className="inline-block w-6">39</span>
            <span className="text-neutral-800">const logicalH = rect?.height ?? 600;</span>
          </div>
          <div className="bg-[#fef2f2] text-[#991b1b] -mx-2 sm:-mx-2.5 px-2 sm:px-2.5 py-0.5 border-l-2 border-rose-400 space-y-0.5">
            <div>
              <span className="inline-block w-6 text-rose-400">40</span>
              <span>- const layoutCanvas = useCallback(</span>
            </div>
            <div>
              <span className="inline-block w-6 text-rose-400">41</span>
              <span>- (ctx: CanvasRenderingContext2D): void =&gt; &#123;</span>
            </div>
            <div>
              <span className="inline-block w-6 text-rose-400">42</span>
              <span>- measureCharSize(ctx);</span>
            </div>
            <div>
              <span className="inline-block w-6 text-rose-400">43</span>
              <span>- const pixelW = logicalW * dpr;</span>
            </div>
            <div>
              <span className="inline-block w-6 text-rose-400">44</span>
              <span>- const pixelH = logicalH * dpr;</span>
            </div>
            <div>
              <span className="inline-block w-6 text-rose-400">45</span>
              <span>- if (!canvasRef.current) return;</span>
            </div>
            <div>
              <span className="inline-block w-6 text-rose-400">46</span>
              <span>- canvasRef.current.width = pixelW;</span>
            </div>
            <div>
              <span className="inline-block w-6 text-rose-400">47</span>
              <span>- canvasRef.current.height = pixelH;</span>
            </div>
            <div>
              <span className="inline-block w-6 text-rose-400">48</span>
              <span>- &#125;,</span>
            </div>
            <div>
              <span className="inline-block w-6 text-rose-400">49</span>
              <span>- [logicalW, logicalH, dpr]</span>
            </div>
            <div>
              <span className="inline-block w-6 text-rose-400">50</span>
              <span>- );</span>
            </div>
          </div>
          <div className="bg-[#f0fdf4] text-[#166534] -mx-2 sm:-mx-2.5 px-2 sm:px-2.5 py-0.5 border-l-2 border-emerald-400 space-y-0.5">
            <div>
              <span className="inline-block w-6 text-emerald-500">40</span>
              <span>+ const layoutCanvas = useCallback(</span>
            </div>
            <div>
              <span className="inline-block w-6 text-emerald-500">41</span>
              <span>
                + (ctx: CanvasRenderingContext2D, coverScale: number): boolean =&gt; &#123;
              </span>
            </div>
            <div>
              <span className="inline-block w-6 text-emerald-500">42</span>
              <span>+ const canvasEl = canvasRef.current;</span>
            </div>
            <div>
              <span className="inline-block w-6 text-emerald-500">43</span>
              <span>+ if (!canvasEl || !containerRef.current) return false;</span>
            </div>
            <div>
              <span className="inline-block w-6 text-emerald-500">44</span>
              <span>+ const scale = Math.min(coverScale, dpr);</span>
            </div>
            <div>
              <span className="inline-block w-6 text-emerald-500">45</span>
              <span>+ canvasEl.width = Math.round(logicalW * scale);</span>
            </div>
            <div>
              <span className="inline-block w-6 text-emerald-500">46</span>
              <span>+ canvasEl.height = Math.round(logicalH * scale);</span>
            </div>
            <div>
              <span className="inline-block w-6 text-emerald-500">47</span>
              <span>+ ctx.scale(scale, scale);</span>
            </div>
            <div>
              <span className="inline-block w-6 text-emerald-500">48</span>
              <span>+ return true;</span>
            </div>
            <div>
              <span className="inline-block w-6 text-emerald-500">49</span>
              <span>+ &#125;,</span>
            </div>
            <div>
              <span className="inline-block w-6 text-emerald-500">50</span>
              <span>+ [logicalW, logicalH, dpr]</span>
            </div>
            <div>
              <span className="inline-block w-6 text-emerald-500">51</span>
              <span>+ );</span>
            </div>
          </div>

          <div className="text-neutral-400 pt-1">
            <span className="inline-block w-6 text-neutral-300">52</span>
            <span className="text-neutral-800">
              const frameId = requestAnimationFrame(() =&gt; draw(ctx));
            </span>
          </div>
          <div className="text-neutral-400">
            <span className="inline-block w-6 text-neutral-300">53</span>
            <span className="text-neutral-800">return () =&gt; cancelAnimationFrame(frameId);</span>
          </div>
        </div>
      </div>
      <div className="absolute right-[4.5%] top-[18%] bottom-[7%] w-[49.5%] rounded-[8px] sm:rounded-[10px] border border-black/[0.08] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] overflow-hidden text-[9.5px] sm:text-[10.5px] md:text-[11px] font-sans flex flex-col justify-between z-10">
        <div className="flex h-8 sm:h-9 shrink-0 items-center justify-between border-b border-neutral-100 px-3 sm:px-3.5 bg-white">
          <span className="text-[11px] sm:text-[12px] font-semibold text-neutral-900">
            Fix canvas render jitter
          </span>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </div>
        </div>
        <div className="p-2.5 sm:p-3 md:p-3.5 space-y-2 sm:space-y-2.5 bg-white overflow-hidden flex flex-col justify-between flex-1">
          <div className="flex justify-end">
            <div className="rounded-[8px] sm:rounded-[10px] bg-neutral-100 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[9.5px] sm:text-[10.5px] md:text-[11px] text-neutral-900 max-w-[92%] leading-[1.35]">
              The canvas flickers during rapid resize on retina screens. Fix the DPR scaling and
              memoize the layout callback.
            </div>
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-neutral-500 font-medium cursor-pointer hover:text-neutral-700">
            <span>Inspected layout engine · 1m 42s</span>
            <ChevronRight size={11} />
          </div>
          <div className="text-[9px] sm:text-[10px] md:text-[10.5px] text-neutral-800 leading-[1.48] space-y-1 sm:space-y-1.5">
            <p>
              Done — I traced the flicker to unmemoized canvas dimension recalculations in
              renderEngine.ts, where logical pixel bounds were thrashing the render context on each
              resize event.
            </p>
            <p className="text-neutral-600">
              I updated layoutCanvas to accept coverScale dynamically, added container ref guards to
              eliminate redundant context recreation, and memoized the layout dependencies.
            </p>
            <p className="text-neutral-600">
              Tested locally across 1x, 2x, and 3x DPR: resize transitions are silky-smooth with
              zero frame drops, and all 14 unit tests pass cleanly.
            </p>
          </div>
          <div className="flex items-center gap-2.5 pt-0.5 text-neutral-400 text-[9.5px]">
            <button type="button" aria-label="Copy message" className="hover:text-neutral-600">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <button type="button" aria-label="Thumbs up" className="hover:text-neutral-600">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            </button>
            <button type="button" aria-label="Thumbs down" className="hover:text-neutral-600">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
              </svg>
            </button>
            <button type="button" aria-label="Share response" className="hover:text-neutral-600">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
            <button type="button" aria-label="More actions" className="hover:text-neutral-600">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between rounded-full border border-neutral-200 bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] shadow-sm shrink-0">
            <div className="flex items-center gap-1.5 text-neutral-400">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Do anything, @ to use plugins</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-neutral-100 px-1 py-0.5 text-[8.5px] sm:text-[9px] font-medium text-neutral-700">
                5.6 Medium ▾
              </span>
              <div className="flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-black text-white cursor-pointer hover:bg-neutral-800">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
