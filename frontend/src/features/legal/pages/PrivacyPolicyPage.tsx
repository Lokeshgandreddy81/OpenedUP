import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Mail, Globe, Lock, UserCheck, EyeOff } from "lucide-react";

export const PrivacyPolicyPage: React.FC = () => {
  useEffect(() => {
    document.title = "Privacy Policy - Sara";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white antialiased selection:bg-neutral-800 selection:text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        {/* Top Navigation Row */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-light text-white/70 transition-opacity hover:opacity-100 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sara</span>
          </Link>

          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 text-xs font-light">
            <span className="rounded-full bg-white/15 px-3 py-1 font-medium text-white">
              Privacy Policy
            </span>
            <Link
              to="/terms"
              className="rounded-full px-3 py-1 text-white/60 transition-colors hover:text-white"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-light tracking-tight text-white sm:text-5xl mb-4">
            Privacy Policy
          </h1>
          <p className="text-base font-light text-white/70 sm:text-lg">
            Last updated: October 30, 2026
          </p>
        </header>

        {/* Commitment Highlight Callout */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-medium tracking-tight text-white">
                Zero Model Training on Customer Code &amp; Data
              </h2>
              <p className="text-sm font-light leading-relaxed text-white/70">
                At Sara (<span className="text-white/90">tosara.in</span>), we never train
                foundation AI models on your private source code, conversation transcripts, uploaded
                documents, or workspace artifacts. What is yours stays strictly yours.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="space-y-12">
          {/* Section: Introduction */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              Your Privacy Matters
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              At Sara (<a href="https://tosara.in" className="underline hover:text-white">tosara.in</a>), we are committed to protecting your privacy and being transparent about how we collect, store, and process your information. This Privacy Policy details the types of data we collect, how that information is utilized, and your fundamental rights regarding your personal information.
            </p>
          </section>

          {/* Section 1: Information We Collect */}
          <section className="space-y-5">
            <h2 className="text-2xl font-light tracking-tight text-white">
              1. Information We Collect
            </h2>

            <div className="space-y-3">
              <h3 className="text-xl font-light tracking-tight text-white/95">
                Information You Provide
              </h3>
              <p className="font-light leading-relaxed text-white/80">
                When you create an account, join our platform, or use Sara&apos;s features, we collect:
              </p>
              <ul className="ml-4 list-disc space-y-2 font-light text-white/80">
                <li>
                  <strong className="font-medium text-white">Contact &amp; Account Information:</strong>{" "}
                  Your name, email address, avatar, authentication credentials (via Google OAuth or email sign-in), and workspace preferences.
                </li>
                <li>
                  <strong className="font-medium text-white">Workspace &amp; Project Data:</strong>{" "}
                  Source code snippets, project folders, prompts, documents, PDF files, receipts, notes, and context files you upload or synchronize with your Sara workspace.
                </li>
                <li>
                  <strong className="font-medium text-white">Communication Data:</strong>{" "}
                  Feedback, bug reports, support inquiries, and correspondence when you reach out to our team.
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xl font-light tracking-tight text-white/95">
                Information We Automatically Collect
              </h3>
              <ul className="ml-4 list-disc space-y-2 font-light text-white/80">
                <li>
                  <strong className="font-medium text-white">Usage Data:</strong> How you interact
                  with our website, AI agents, execution logs, tool invocations, and workspace features.
                </li>
                <li>
                  <strong className="font-medium text-white">Technical Information:</strong> IP address,
                  browser type, device hardware, operating system, and session timestamps.
                </li>
                <li>
                  <strong className="font-medium text-white">Telemetry &amp; Diagnostics:</strong> Anonymized
                  performance metrics, error traces, and latency logs necessary to keep the platform reliable and performant.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2: How We Use Your Information */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              2. How We Use Your Information
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              We process your data strictly for legitimate operational purposes:
            </p>
            <ul className="ml-4 list-disc space-y-2 font-light text-white/80">
              <li>
                <strong className="font-medium text-white">Provide &amp; Deliver Our Service:</strong> Powering
                autonomous coding tasks, context-aware analysis, document reconciliation, and code generation.
              </li>
              <li>
                <strong className="font-medium text-white">Communicate With You:</strong> Sending essential
                account authentication notices, system updates, security advisories, and replies to support inquiries.
              </li>
              <li>
                <strong className="font-medium text-white">Improve Our Platform:</strong> Analyzing aggregated
                system performance to improve agent capabilities, reduce response latencies, and debug platform errors.
              </li>
              <li>
                <strong className="font-medium text-white">Ensure Infrastructure Security:</strong> Detecting,
                preventing, and responding to fraud, abuse, automated attacks, and security vulnerabilities.
              </li>
              <li>
                <strong className="font-medium text-white">Comply With Legal Requirements:</strong> Satisfying
                applicable statutory obligations, tax laws, and lawful government requests.
              </li>
            </ul>
          </section>

          {/* Section 3: Information Sharing */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              3. Information Sharing
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              <strong className="font-medium text-white">We do not sell, rent, or trade your personal information.</strong> We only share information under strict and limited circumstances:
            </p>
            <ul className="ml-4 list-disc space-y-2 font-light text-white/80">
              <li>
                <strong className="font-medium text-white">Trusted Service Providers:</strong> Specialized infrastructure partners who assist in operating our platform (e.g., Vercel for hosting, Supabase for authentication &amp; database storage, and enterprise LLM inference providers under strict zero-retention non-training terms).
              </li>
              <li>
                <strong className="font-medium text-white">Legal Obligations:</strong> When compelled by valid legal subpoenas, court orders, or applicable statutory laws.
              </li>
              <li>
                <strong className="font-medium text-white">Business Transfers:</strong> In the event that Sara is involved in a merger, acquisition, or sale of company assets, your information remains governed by the commitments in this policy.
              </li>
              <li>
                <strong className="font-medium text-white">With Your Consent:</strong> When you expressly authorize us to share information with a third-party service or plugin.
              </li>
            </ul>
          </section>

          {/* Section 4: Data Security */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              4. Data Security
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              We implement industry-standard safeguards to protect your code and personal information:
            </p>
            <ul className="ml-4 list-disc space-y-2 font-light text-white/80">
              <li>
                <strong className="font-medium text-white">Modern Encryption:</strong> All data in transit is encrypted using TLS 1.3 / HTTPS, and data stored in our databases is encrypted at rest using AES-256.
              </li>
              <li>
                <strong className="font-medium text-white">Strict Access Controls:</strong> Least-privilege access protocols limit internal access to authenticated and authorized personnel only.
              </li>
              <li>
                <strong className="font-medium text-white">Isolated Execution Sandboxes:</strong> Agent workspaces operate within isolated runtimes to prevent cross-account contamination.
              </li>
              <li>
                <strong className="font-medium text-white">Audits &amp; Hardening:</strong> Regular vulnerability scanning, dependency updating, and threat modeling to safeguard our infrastructure.
              </li>
            </ul>
          </section>

          {/* Section 5: Your Rights and Choices */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              5. Your Rights and Choices
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              You maintain full ownership and control over your personal data:
            </p>
            <ul className="ml-4 list-disc space-y-2 font-light text-white/80">
              <li>
                <strong className="font-medium text-white">Access &amp; Export:</strong> Request a copy of your personal data and uploaded workspace history.
              </li>
              <li>
                <strong className="font-medium text-white">Rectification:</strong> Correct or update any inaccurate personal details at any time.
              </li>
              <li>
                <strong className="font-medium text-white">Deletion (Right to Erasure):</strong> Request permanent deletion of your account and all associated workspace data.
              </li>
              <li>
                <strong className="font-medium text-white">Opt-Out:</strong> Unsubscribe from non-essential promotional communications via the unsubscribe link in our emails.
              </li>
            </ul>
            <p className="mt-4 font-light leading-relaxed text-white/80">
              To exercise any of these rights, simply email us at{" "}
              <a
                href="mailto:privacy@tosara.in"
                className="underline hover:text-white transition-colors"
              >
                privacy@tosara.in
              </a>
              .
            </p>
          </section>

          {/* Section 6: Cookies and Tracking */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              6. Cookies and Tracking
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              We use strictly necessary cookies and local storage tokens to:
            </p>
            <ul className="ml-4 list-disc space-y-2 font-light text-white/80">
              <li>Keep you securely authenticated across sessions</li>
              <li>Remember your UI preferences and workspace view settings</li>
              <li>Analyze anonymous platform performance metrics</li>
            </ul>
            <p className="font-light leading-relaxed text-white/80 pt-2">
              We do not utilize invasive third-party cross-site advertising trackers. You can configure your browser to decline cookies, though certain interactive features of the platform may not function correctly.
            </p>
          </section>

          {/* Section 7: Data Retention */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              7. Data Retention
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              We keep your information only as long as necessary to provide you with the Service and satisfy legal requirements. When you delete a chat session, workspace file, or request account closure, we purge your data from our primary databases within 30 days.
            </p>
          </section>

          {/* Section 8: International Users */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              8. International Users
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              If you access Sara (<a href="https://tosara.in" className="underline hover:text-white">tosara.in</a>) from outside India or the United States, please note that your data may be processed in secure facilities located globally. We take appropriate measures and safeguards to ensure your personal data remains protected in compliance with applicable cross-border data protection standards.
            </p>
          </section>

          {/* Section 9: Children's Privacy */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              9. Children&apos;s Privacy
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              Sara is designed for software developers, founders, and professionals aged 18 and older. We do not knowingly collect personal information from individuals under 18. If you believe a minor has provided us with personal data, please contact us immediately and we will promptly delete it.
            </p>
          </section>

          {/* Section 10: Changes to This Policy */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              10. Changes to This Policy
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              We may update this Privacy Policy as our services and features evolve. We will notify you of material changes via email or an in-app notice prior to changes taking effect. The &ldquo;Last updated&rdquo; timestamp at the top of this document indicates when changes were published.
            </p>
          </section>

          {/* Section 11: Contact Us */}
          <section className="space-y-4">
            <h2 className="text-2xl font-light tracking-tight text-white">
              11. Contact Us
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              Have questions or concerns about this Privacy Policy or how your data is handled? Reach out to our privacy team:
            </p>
            <ul className="space-y-2 font-light text-white/80">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-white/60" />
                <span>Privacy Inquiries:</span>
                <a
                  href="mailto:privacy@tosara.in"
                  className="underline hover:text-white transition-colors"
                >
                  privacy@tosara.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-white/60" />
                <span>General Support:</span>
                <a
                  href="mailto:support@tosara.in"
                  className="underline hover:text-white transition-colors"
                >
                  support@tosara.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-white/60" />
                <span>Website:</span>
                <a
                  href="https://tosara.in"
                  className="underline hover:text-white transition-colors"
                >
                  tosara.in
                </a>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer Note */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-center text-sm font-light text-white/50 sm:flex-row sm:text-left">
          <div>&copy; 2026 Sara AI, Inc. &middot; tosara.in</div>
          <div>We&apos;re committed to protecting your privacy and being transparent about our practices.</div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
