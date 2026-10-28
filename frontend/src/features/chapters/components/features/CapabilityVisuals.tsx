import React from "react";
import { Check, FileText, MessageSquare, Terminal } from "lucide-react";
import type { CapabilityId } from "../../data/featuresContent";

export interface CapabilityVisualProps {
  id: CapabilityId;
}

export const CapabilityVisual: React.FC<CapabilityVisualProps> = ({ id }) => (
  <div className="mt-4 flex flex-1 flex-col justify-end">
    {id === "chat" && <ChatCardVisual />}
    {id === "documents" && <DocumentsCardVisual />}
    {id === "audit" && <AuditCardVisual />}
    {id === "agents" && <AgentsCardVisual />}
    {id === "benchmarks" && <BenchmarksCardVisual />}
    {id === "plugins" && <PluginsCardVisual />}
  </div>
);

const ChatCardVisual: React.FC = () => (
  <div className="rounded-2xl bg-[#f6f8fc] p-3.5">
    <div className="flex justify-end">
      <div className="max-w-[82%] rounded-xl rounded-tr-sm bg-white px-3 py-2 text-[10px] leading-relaxed text-neutral-700">
        Summarize chapter 3 and cite the page.
      </div>
    </div>
    <div className="mt-2.5 flex gap-2">
      <img
        src="/logos/brand-logo.png"
        alt="Sara"
        className="mt-0.5 h-5 w-5 shrink-0 object-contain"
      />
      <div className="space-y-1.5 rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[10px] leading-relaxed text-neutral-600">
        <p>
          Risk is concentrated in two suppliers —{" "}
          <span className="rounded bg-[#eef4ff] px-1 py-0.5 font-mono text-[8px] text-[#2f91fd]">
            p. 24
          </span>
          . A single disruption affects Q3 volume.
        </p>
        <div className="flex items-center gap-1 pt-0.5 text-[8.5px] text-neutral-400">
          <FileText className="h-2.5 w-2.5 text-neutral-400" />
          <span>Sources · 3 files referenced</span>
        </div>
      </div>
    </div>
    <div className="mt-3 flex items-center gap-1.5">
      {["Argon", "Opus 5.5"].map((model, index) => (
        <span
          key={model}
          className={`rounded-full px-2 py-0.5 text-[8.5px] font-medium ${
            index === 0 ? "bg-neutral-950 text-white" : "bg-white text-neutral-500"
          }`}
        >
          {model}
        </span>
      ))}
    </div>
  </div>
);

const DocumentsCardVisual: React.FC = () => (
  <div className="rounded-2xl bg-[#f6f8fc] p-3.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#eef4ff] text-[#2f91fd]">
          <FileText className="h-2.5 w-2.5" strokeWidth={2} />
        </span>
        <span className="text-[9px] font-medium text-neutral-700">annual-report.pdf</span>
      </div>
      <span className="font-mono text-[8px] text-neutral-400">112 p.</span>
    </div>
    <div className="mt-3 space-y-1.5">
      <span className="block h-1.5 w-[94%] rounded bg-white" />
      <span className="block h-1.5 w-[86%] rounded bg-white" />
      <span className="block h-1.5 w-[91%] rounded bg-white" />
      <span className="block h-1.5 w-[70%] rounded bg-white" />
    </div>
    <div className="mt-3 space-y-1">
      {["01 Summary", "02 Market overview", "03 Risk factors"].map((chapter, index) => (
        <div
          key={chapter}
          className={`flex items-center justify-between rounded-md px-2 py-1 text-[9px] ${
            index === 2 ? "bg-[#eef4ff] font-medium text-[#1c63d6]" : "text-neutral-500"
          }`}
        >
          <span>{chapter}</span>
          {index === 2 && <span className="font-mono text-[8px]">p. 48</span>}
        </div>
      ))}
    </div>
  </div>
);

const AuditCardVisual: React.FC = () => (
  <div className="rounded-2xl bg-[#f6f8fc] p-3.5">
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-medium text-neutral-700">April expenses</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[8px] font-medium text-neutral-950">
        <Check className="h-2.5 w-2.5 text-neutral-950" strokeWidth={2.6} /> Reconciled
      </span>
    </div>
    <div className="mt-3 space-y-1">
      {[
        { name: "Northstar · receipt 01", amount: "₹412.80" },
        { name: "Fieldnote · receipt 02", amount: "₹268.40" },
        { name: "Vela · receipt 03", amount: "₹182.00" },
      ].map((row) => (
        <div
          key={row.name}
          className="flex items-center justify-between rounded-md px-2 py-1 text-[8.5px] odd:bg-white"
        >
          <span className="truncate text-neutral-600">{row.name}</span>
          <span className="flex shrink-0 items-center font-mono text-[8px] text-neutral-500">
            {row.amount}
          </span>
        </div>
      ))}
    </div>
    <div className="mt-3 flex items-end justify-between pt-2">
      <span className="text-[8.5px] uppercase tracking-[0.1em] text-neutral-400">Total</span>
      <span className="text-[16px] font-semibold tracking-[-0.03em] text-neutral-950">
        ₹2,481.60
      </span>
    </div>
  </div>
);

const AgentsCardVisual: React.FC = () => (
  <div className="overflow-hidden rounded-2xl bg-[#f6f8fc] p-3.5">
    <div className="flex items-center justify-between pb-2">
      <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-neutral-800">
        <Terminal className="h-2.5 w-2.5 text-[#2f91fd]" /> Agent run
      </span>
      <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-medium text-neutral-950">
        Ready
      </span>
    </div>
    <div className="space-y-1 py-2 font-mono text-[8px] leading-[1.7]">
      <div className="text-neutral-600">
        <span className="mr-1.5 text-neutral-400">42</span> const existing = await findPending(cart);
      </div>
      <div className="rounded bg-rose-50/90 px-1.5 text-rose-600">
        <span className="mr-1.5 text-rose-400">43 -</span> if (!existing) await createOrder(cart);
      </div>
      <div className="rounded bg-emerald-50/90 px-1.5 text-emerald-700">
        <span className="mr-1.5 text-emerald-500">43 +</span> return existing ?? createOrder(cart);
      </div>
    </div>
    <div className="flex items-center justify-between pt-2 text-[8.5px] text-neutral-500">
      <span className="inline-flex items-center gap-1 text-neutral-500">
        <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={2.6} /> 14 tests passing
      </span>
      <span className="font-mono text-[8px] text-neutral-400">0.4s</span>
    </div>
  </div>
);

const BenchmarksCardVisual: React.FC = () => (
  <div className="rounded-2xl bg-[#f6f8fc] p-3.5">
    <div className="flex items-center justify-between pb-2">
      <span className="text-[10px] font-semibold text-neutral-900">Overall score</span>
      <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[8.5px] text-neutral-500">
        1,284 runs
      </span>
    </div>
    <div className="mt-2.5 space-y-2.5">
      {[
        { label: "Argon", value: 92, active: true },
        { label: "Opus 5.5", value: 86, active: false },
        { label: "Fable 5.1", value: 79, active: false },
        { label: "Muse Wonder", value: 71, active: false },
      ].map((row) => (
        <div key={row.label} className="flex items-center gap-2.5">
          <span
            className={`w-[70px] shrink-0 text-[9.5px] ${
              row.active ? "font-semibold text-neutral-950" : "font-normal text-neutral-600"
            }`}
          >
            {row.label}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                row.active ? "bg-neutral-950" : "bg-neutral-300"
              }`}
              style={{ width: `${row.value}%` }}
            />
          </div>
          <span
            className={`w-5 shrink-0 text-right font-mono text-[9px] ${
              row.active ? "font-semibold text-neutral-950" : "text-neutral-400"
            }`}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
    <div className="mt-3.5 flex items-center justify-between pt-1.5 text-[8.5px] text-neutral-500">
      <span>Arena results updated hourly</span>
      <span className="font-mono text-[8px] text-neutral-400">Verified</span>
    </div>
  </div>
);

const GmailLogo: React.FC = () => (
  <svg viewBox="0 0 256 256" className="h-4 w-4" fill="none" aria-label="Gmail">
    <path d="M41.6 203H73.5V125.8L28 91.7v97.7c0 7.5 6.1 13.6 13.6 13.6Z" fill="#4285F4" />
    <path d="M182.5 203h31.9c7.5 0 13.6-6.1 13.6-13.6V91.7l-45.5 34.1" fill="#34A853" />
    <path d="M182.5 66.7v59.1L228 91.7V73.5c0-16.9-19.3-26.5-32.7-16.4" fill="#FBBC04" />
    <path d="M73.5 125.8V66.7L128 107.6l54.5-40.9v59.1L128 166.7" fill="#EA4335" />
    <path d="M28 73.5v18.2l45.5 34.1V66.7L60.7 57.1C47.2 47 28 56.6 28 73.5Z" fill="#C5221F" />
  </svg>
);

const GitHubLogo: React.FC = () => (
  <svg viewBox="0 0 512 512" className="h-4 w-4" fill="#1b1f23" aria-label="GitHub">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M256 6.3C114.6 6.3 0 120.9 0 262.3c0 113.3 73.3 209 175 242.9 12.8 2.2 17.6-5.4 17.6-12.2 0-6.1-.3-26.2-.3-47.7-64.3 11.8-81-15.7-86.1-30.1-2.9-7.4-15.4-30.1-26.2-36.2-9-4.8-21.8-16.6-.3-17 20.2-.3 34.6 18.6 39.4 26.2 23 38.7 59.8 27.8 74.6 21.1 2.2-16.6 9-27.8 16.3-34.2-57-6.4-116.5-28.5-116.5-126.4 0-27.8 9.9-50.9 26.2-68.8-2.6-6.4-11.5-32.6 2.6-67.8 0 0 21.4-6.7 70.4 26.2 20.5-5.8 42.2-8.6 64-8.6s43.5 2.9 64 8.6c49-33.3 70.4-26.2 70.4-26.2 14.1 35.2 5.1 61.4 2.6 67.8 16.3 17.9 26.2 40.6 26.2 68.8 0 98.2-59.8 120-116.8 126.4 9.3 8 17.3 23.4 17.3 47.4 0 34.2-.3 61.8-.3 70.4 0 6.7 4.8 14.7 17.6 12.2C438.7 471.3 512 375.3 512 262.3c0-141.4-114.6-256-256-256"
    />
  </svg>
);

const FigmaLogo: React.FC = () => (
  <svg viewBox="0 0 200 300" className="h-4 w-4" aria-label="Figma">
    <path fill="#0ACF83" d="M50 300c27.6 0 50-22.4 50-50v-50H50c-27.6 0-50 22.4-50 50s22.4 50 50 50z" />
    <path fill="#A259FF" d="M0 150c0-27.6 22.4-50 50-50h50v100H50c-27.6 0-50-22.4-50-50z" />
    <path fill="#F24E1E" d="M0 50C0 22.4 22.4 0 50 0h50v100H50C22.4 100 0 77.6 0 50z" />
    <path fill="#FF7262" d="M100 0h50c27.6 0 50 22.4 50 50s-22.4 50-50 50h-50V0z" />
    <path fill="#1ABCFE" d="M200 150c0 27.6-22.4 50-50 50s-50-22.4-50-50 22.4-50 50-50 50 22.4 50 50z" />
  </svg>
);

const SupabaseLogo: React.FC = () => (
  <svg viewBox="0 0 512 512" className="h-4 w-4" aria-label="Supabase">
    <defs>
      <linearGradient id="supa-gradient-real" x1="237.1" x2="419.1" y1="223.2" y2="146.9" gradientTransform="matrix(1 0 0 -1 0 513)" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#249361" />
        <stop offset="1" stopColor="#3ecf8e" />
      </linearGradient>
    </defs>
    <path d="M297.6 501c-12.9 16.3-39.2 7.4-39.5-13.4L253.6 183h204.8c37.1 0 57.8 42.8 34.7 71.9z" fill="url(#supa-gradient-real)" />
    <path d="M214.4 11c12.9-16.3 39.2-7.4 39.5 13.4l2 304.5H53.7c-37.1 0-57.8-42.8-34.7-71.9z" fill="#3ecf8e" />
  </svg>
);

const GoogleCalendarLogo: React.FC = () => (
  <svg viewBox="0 0 512 512" className="h-4 w-4" aria-label="Google Calendar">
    <path d="M387 117.5 265.7 104l-148.2 13.5L104 252.2 117.5 387l134.7 16.8L387 387l13.5-138.1z" fill="#fff" transform="translate(3.75 3.75)" />
    <path d="M176.55 330.35c-10.1-6.8-17-16.7-20.9-29.9l23.4-9.6c2.1 8.1 5.8 14.3 11.1 18.8 5.3 4.4 11.7 6.6 19.1 6.6 7.6 0 14.2-2.3 19.7-7s8.3-10.6 8.3-17.8q0-10.95-8.7-18c-5.8-4.6-13.1-7-21.8-7h-13.5v-23.1h12.1c7.5 0 13.8-2 18.9-6.1 5.1-4 7.7-9.6 7.7-16.6q0-9.45-6.9-15c-4.6-3.7-10.4-5.6-17.4-5.6-6.9 0-12.3 1.8-16.4 5.5-4 3.7-7 8.2-8.8 13.5l-23.1-9.6c3.1-8.7 8.7-16.4 16.9-23 8.3-6.6 18.8-10 31.6-10 9.5 0 18 1.8 25.5 5.5s13.5 8.8 17.8 15.2c4.3 6.5 6.4 13.8 6.4 21.9 0 8.3-2 15.2-6 21q-6 8.55-14.7 13.2v1.4c7.6 3.2 13.9 8.1 18.8 14.7s7.3 14.4 7.3 23.6-2.3 17.3-7 24.5c-4.6 7.2-11.1 12.8-19.2 16.9-8.2 4.1-17.4 6.2-27.6 6.2-11.6 0-22.5-3.4-32.6-10.2m143.4-116-25.5 18.6-12.8-19.5 46-33.2h17.7v156.7h-25.3v-122.6z" fill="#1a73e8" />
    <path d="M387 508.2 508.2 387l-60.6-27-60.6 27-27 60.6z" fill="#ea4335" transform="translate(3.75 3.75)" />
    <path d="m90.6 447.6 26.9 60.6H387V387H117.5z" fill="#34a853" transform="translate(3.75 3.75)" />
    <path d="M36.7-3.8C14.3-3.8-3.8 14.3-3.8 36.7V387l60.6 26.9 60.6-26.9V117.5H387l26.9-60.6L387-3.8z" fill="#4285f4" transform="translate(3.75 3.75)" />
    <path d="M-3.8 387v80.8c0 22.3 18.1 40.4 40.4 40.4h80.8V387z" fill="#188038" transform="translate(3.75 3.75)" />
    <path d="M387 117.5V387h121.3V117.5l-60.6-26.9z" fill="#fbbc04" transform="translate(3.75 3.75)" />
    <path d="M508.2 117.5V36.7c0-22.3-18.1-40.4-40.4-40.4H387v121.3h121.2z" fill="#1967d2" transform="translate(3.75 3.75)" />
  </svg>
);

const NotionLogo: React.FC = () => (
  <svg viewBox="0 0 512 512" className="h-4 w-4" aria-label="Notion">
    <path d="M41.8 22.1 325.1 1.2c34.8-3 43.7-1 65.6 14.9l90.4 63.7c14.9 11 19.9 13.9 19.9 25.9v349.4c0 21.9-8 34.9-35.8 36.8l-329 19.9c-20.9 1-30.8-2-41.8-15.9l-66.6-86.6C15.9 393.4 11 381.4 11 367.5V56.9c0-17.9 7.9-32.8 30.8-34.8" fill="#fff" />
    <path
      d="M325.1 1.2 41.8 22.1C18.9 24.1 11 39 11 56.9v310.6c0 13.9 5 25.9 16.9 41.8l66.6 86.6c10.9 13.9 20.9 16.9 41.8 15.9l329-19.9c27.8-2 35.8-14.9 35.8-36.8V105.7c0-11.3-4.5-14.6-17.6-24.2l-92.7-65.4C368.8.2 359.9-1.8 325.1 1.2M143.7 100c-26.9 1.8-33 2.2-48.2-10.2L56.7 58.9c-3.9-4-2-9 8-10L337 29.1c22.9-2 34.8 6 43.7 12.9l46.7 33.8c2 1 7 7 1 7L147.2 99.7zm-31.3 352.1V155.5c0-13 4-18.9 15.9-19.9l323-18.9c11-1 15.9 6 15.9 18.9v294.6c0 13-2 23.9-19.9 24.9L138.2 473c-17.9 1-25.8-5-25.8-20.9m305.1-280.7c2 9 0 17.9-9 18.9l-14.9 3v219c-12.9 7-24.8 10.9-34.8 10.9-15.9 0-19.9-5-31.8-19.9L229.6 250v148.3l30.8 7s0 17.9-24.9 17.9l-68.6 4c-2-4 0-13.9 6.9-15.9l17.9-5V210.2l-24.8-2c-2-9 3-21.9 16.9-22.9l73.6-5 101.4 155.3V198.3l-25.8-3c-2-11 6-18.9 15.9-19.9z"
      fillRule="evenodd"
      clipRule="evenodd"
      fill="#000"
    />
  </svg>
);

const connectedApps = [
  { name: "Gmail", Icon: GmailLogo },
  { name: "GitHub", Icon: GitHubLogo },
  { name: "Figma", Icon: FigmaLogo },
  { name: "Supabase", Icon: SupabaseLogo },
  { name: "Google Calendar", Icon: GoogleCalendarLogo },
  { name: "Notion", Icon: NotionLogo },
];

const PluginsCardVisual: React.FC = () => (
  <div className="rounded-2xl bg-[#f6f8fc] p-3.5">
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-[9px] font-medium text-neutral-700">
        <MessageSquare className="h-2.5 w-2.5 text-neutral-400" /> Connected apps
      </span>
      <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-medium text-neutral-600">
        6 active
      </span>
    </div>
    <div className="mt-3 grid grid-cols-3 gap-1.5">
      {connectedApps.map(({ name, Icon }) => (
        <div
          key={name}
          className="flex items-center justify-center rounded-xl bg-white py-2.5"
          title={name}
        >
          <Icon />
        </div>
      ))}
    </div>
    <div className="mt-3 flex items-center gap-1.5 text-[8.5px] text-neutral-500">
      <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={2.6} />
      Context shared only when you ask
    </div>
  </div>
);
