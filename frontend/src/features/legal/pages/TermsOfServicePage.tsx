import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Scale, Mail, Globe, CheckCircle2, ShieldAlert } from "lucide-react";

export const TermsOfServicePage: React.FC = () => {
  useEffect(() => {
    document.title = "Terms of Service - Sara";
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
            <Link
              to="/privacy"
              className="rounded-full px-3 py-1 text-white/60 transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
            <span className="rounded-full bg-white/15 px-3 py-1 font-medium text-white">
              Terms of Service
            </span>
          </div>
        </div>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-light tracking-tight text-white sm:text-5xl mb-4">
            Terms of Service
          </h1>
          <p className="text-base font-light text-white/70 sm:text-lg">
            Last updated: October 30, 2026
          </p>
        </header>

        {/* Highlight Callout */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <Scale className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-medium tracking-tight text-white">
                Clear, Founder-Friendly Terms
              </h2>
              <p className="text-sm font-light leading-relaxed text-white/70">
                You retain full ownership of all code, documents, prompts, and outputs you create
                using Sara (<span className="text-white/90">tosara.in</span>). Our terms are written
                to empower engineering teams and founders while keeping expectations transparent.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Content Sections */}
        <div className="space-y-12">
          {/* Section: Welcome */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              Welcome to Sara
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Sara&apos;s website (<a href="https://tosara.in" className="underline hover:text-white">tosara.in</a>), AI agent execution platform, workspace sync tools, APIs, and associated software products (collectively, the &ldquo;Service&rdquo;). By accessing our website, creating an account, or using our services, you agree to be bound by these Terms.
            </p>
          </section>

          {/* Section 1: Our Service */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              1. Our Service
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              Sara is an AI-powered engineering and productivity partner designed to help founders, engineers, and teams:
            </p>
            <ul className="ml-4 list-disc space-y-2 font-light text-white/80">
              <li>Orchestrate multi-agent autonomous coding tasks and full-stack software development</li>
              <li>Reconcile financial receipts, analyze complex documents, and audit long PDFs</li>
              <li>Explore codebase architectures, automate bug fixes, and perform contextual refactoring</li>
              <li>Verify web applications and code changes in live sandboxes with automated test validation</li>
              <li>Accelerate product execution while maintaining engineering rigor and security standards</li>
            </ul>
          </section>

          {/* Section 2: Account Registration and Beta Access */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              2. Account Registration and Access
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              To access certain features of Sara, you must authenticate using Google OAuth or a supported account credential. By registering:
            </p>
            <ul className="ml-4 list-disc space-y-2 font-light text-white/80">
              <li>You represent that you are at least 18 years of age and legally authorized to enter into this agreement.</li>
              <li>You agree to provide true, current, and accurate credentials and profile details.</li>
              <li>You are solely responsible for safeguarding your login credentials and for all actions taken under your account.</li>
              <li>Early access and beta features are provided for developmental evaluation and may change as we refine the platform.</li>
            </ul>
          </section>

          {/* Section 3: Your Responsibilities */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              3. Your Responsibilities &amp; Acceptable Use
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              When utilizing Sara, you agree to:
            </p>
            <ul className="ml-4 list-disc space-y-2 font-light text-white/80">
              <li>Use the Service exclusively for lawful software development, research, and legitimate business activities.</li>
              <li>Never deploy harmful payloads, viruses, malicious bots, or code intended to breach or disrupt third-party infrastructure.</li>
              <li>Never attempt to reverse engineer, decompile, or circumvent the platform&apos;s security sandboxes or access boundaries.</li>
              <li>Respect the intellectual property, copyright, and patent rights of third parties in the code and materials you upload.</li>
              <li>Adhere to all applicable local, national, and international cybersecurity and export compliance laws.</li>
            </ul>
          </section>

          {/* Section 4: AI and Advice Disclaimer */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              4. AI Output and Advice Disclaimer
            </h2>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-white/90">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="space-y-2 text-sm font-light leading-relaxed text-white/80">
                  <p>
                    <strong className="font-medium text-white">Important Notice:</strong> Sara provides AI-generated code, analysis, summaries, and suggestions based on probabilistic language models:
                  </p>
                  <ul className="list-disc space-y-1.5 pl-4">
                    <li>AI responses and generated code may occasionally contain omissions, logic bugs, or hallucinated APIs.</li>
                    <li>
                      <strong className="font-medium text-white">Human Verification Required:</strong> You are solely responsible for testing, auditing, and validating all code and outputs prior to production deployment.
                    </li>
                    <li>
                      Analysis related to legal documents, contracts, accounting records, or tax receipts is provided for workflow productivity only and does NOT constitute certified legal, tax, or financial advice.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Intellectual Property */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              5. Intellectual Property &amp; Content Ownership
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              We respect your work and proprietary engineering assets:
            </p>
            <ul className="ml-4 list-disc space-y-2 font-light text-white/80">
              <li>
                <strong className="font-medium text-white">Your Content:</strong> You retain complete ownership, copyright, and title to all repositories, files, prompts, and data you submit to Sara.
              </li>
              <li>
                <strong className="font-medium text-white">Generated Work Product:</strong> You own the outputs, artifacts, and code generated by Sara for your projects, subject to your compliance with these Terms.
              </li>
              <li>
                <strong className="font-medium text-white">Sara Platform IP:</strong> Sara AI, Inc. retains all rights, title, and intellectual property in the Sara platform, brand assets, logos, user interfaces, documentation, and agent orchestration frameworks.
              </li>
            </ul>
          </section>

          {/* Section 6: Privacy and Data Protection */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              6. Privacy and Data Protection
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              We treat your privacy with utmost seriousness. Please review our{" "}
              <Link to="/privacy" className="underline hover:text-white transition-colors">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference, to understand how we store, process, and protect your information.
            </p>
          </section>

          {/* Section 7: Service Availability */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              7. Service Availability &amp; Modifications
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              While we strive for high uptime and rapid agent execution, we cannot guarantee uninterrupted or defect-free service at all times. We reserve the right to perform routine system maintenance, apply bug fixes, deploy new model integrations, and adjust platform features to enhance stability.
            </p>
          </section>

          {/* Section 8: Pricing and Subscriptions */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              8. Pricing, Billing, and Subscriptions
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              Certain features of Sara are made available free of charge, while advanced autonomous capabilities and extended compute tiers may require a paid subscription or usage credit. Pricing details are published transparently on our platform. All payments are processed securely through certified third-party payment providers. You may cancel your subscription at any time via your account settings.
            </p>
          </section>

          {/* Section 9: Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              9. Limitation of Liability
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              Sara is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express or implied. To the maximum extent permitted by applicable law, Sara AI, Inc. and its officers, directors, and employees shall not be liable for any indirect, incidental, punitive, or consequential damages (including lost profits, lost business opportunities, data loss, or server downtime) resulting from your use of or inability to use the Service.
            </p>
          </section>

          {/* Section 10: Indemnification */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              10. Indemnification
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              You agree to defend, indemnify, and hold harmless Sara AI, Inc. and its affiliates from and against any third-party claims, liabilities, damages, and expenses (including reasonable legal fees) arising from your misuse of the Service or violation of these Terms.
            </p>
          </section>

          {/* Section 11: Changes to Terms */}
          <section className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-white">
              11. Changes to Terms
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              We may update these Terms periodically as our platform grows. We will notify active users of significant revisions via email or platform announcements before they take effect. Your continued use of Sara following published revisions constitutes your acceptance of the updated Terms.
            </p>
          </section>

          {/* Section 12: Contact Us */}
          <section className="space-y-4">
            <h2 className="text-2xl font-light tracking-tight text-white">
              12. Contact Us
            </h2>
            <p className="font-light leading-relaxed text-white/80">
              Questions regarding these Terms of Service or legal matters? Contact our team:
            </p>
            <ul className="space-y-2 font-light text-white/80">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-white/60" />
                <span>Legal &amp; Terms:</span>
                <a
                  href="mailto:legal@tosara.in"
                  className="underline hover:text-white transition-colors"
                >
                  legal@tosara.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-white/60" />
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
          <div>By using Sara, you agree to these Terms of Service and our Privacy Policy.</div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
