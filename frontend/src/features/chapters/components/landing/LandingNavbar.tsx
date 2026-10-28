import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

export interface LandingNavbarProps {
  onGetStarted?: () => void;
  isScrolled?: boolean;
}

export const ChatGPTLogo: React.FC<{ className?: string }> = ({
  className = "h-[21px] w-[21px] text-black",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M8.19 22.442 C8.639 22.182 9.703 21.654 10.672 21.209 C12.482 20.379 13.022 20.053 13.712 19.371 C14.596 18.499 15.014 17.589 15.069 16.424 C15.123 15.259 14.805 14.146 14.091 13.0 C13.966 12.799 13.853 12.634 13.841 12.634 C13.828 12.634 13.784 12.729 13.742 12.845 C13.462 13.626 12.707 14.398 11.517 15.116 C9.98 16.045 9.422 16.517 8.865 17.357 C8.025 18.624 7.68 19.951 7.68 21.923 L7.68 22.75 L7.78 22.686 C7.835 22.65 8.019 22.541 8.19 22.442 Z M20.192 15.626 C20.401 15.59 20.738 15.508 20.941 15.444 C21.277 15.338 22.064 15.019 22.115 14.969 C22.126 14.957 22.033 14.852 21.908 14.735 C21.591 14.439 21.31 13.996 20.556 12.612 C19.674 10.992 19.389 10.581 18.79 10.064 C17.424 8.886 15.798 8.787 14.147 9.783 C13.697 10.054 13.113 10.468 12.824 10.719 L12.628 10.89 L12.929 10.966 C13.846 11.197 14.377 11.701 15.437 13.347 C15.841 13.975 16.268 14.469 16.685 14.789 C16.967 15.007 17.563 15.337 17.876 15.451 C18.511 15.682 19.462 15.754 20.192 15.626 Z M9.102 14.956 C9.84 14.829 10.446 14.58 11.16 14.108 C11.582 13.83 12.213 13.341 12.186 13.314 C12.178 13.305 12.054 13.267 11.913 13.23 C11.383 13.093 10.834 12.726 10.354 12.191 C10.052 11.854 9.808 11.525 9.288 10.75 C8.532 9.626 7.977 9.08 7.215 8.713 C6.669 8.449 6.347 8.375 5.639 8.347 C4.888 8.318 4.322 8.401 3.583 8.648 C3.046 8.827 1.874 9.371 1.874 9.441 C1.874 9.461 1.939 9.517 2.018 9.564 C2.495 9.849 2.89 10.348 3.803 11.815 C4.517 12.963 4.793 13.334 5.293 13.822 C5.841 14.356 6.315 14.641 7.007 14.851 C7.186 14.905 7.435 14.964 7.561 14.983 C7.966 15.042 8.672 15.03 9.102 14.956 Z M11.092 11.308 C11.094 11.166 11.458 10.51 11.687 10.236 C12.059 9.79 12.481 9.454 13.597 8.712 C14.646 8.016 15.201 7.572 15.597 7.113 C16.447 6.129 17.089 4.775 17.339 3.437 C17.51 2.519 17.585 1.25 17.465 1.301 C17.434 1.314 17.15 1.443 16.833 1.588 C16.516 1.733 15.908 1.996 15.481 2.173 C13.352 3.059 12.685 3.349 12.401 3.511 C11.43 4.067 10.554 4.929 10.133 5.743 C9.552 6.866 9.486 8.151 9.938 9.531 C10.171 10.242 10.957 11.583 11.053 11.433 C11.074 11.399 11.092 11.342 11.092 11.308 Z" fill="currentColor" />
  </svg>
);

export const BridgeMindLogoIcon: React.FC<{ className?: string }> = ({
  className = "h-6 w-6",
}) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="bm-amber-grad" x1="0" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="60%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="bm-blue-grad" x1="16" y1="4" x2="32" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#0066FF" />
        <stop offset="100%" stopColor="#0047EB" />
      </linearGradient>
    </defs>
    <path
      d="M13.8 3.2C14.4 2.5 15.5 3 15.3 3.9L12.9 13.5H17.2C17.9 13.5 18.3 14.4 17.8 14.9L9.8 24.2C9.2 24.9 8.1 24.4 8.3 23.5L10.7 13.9H6.4C5.7 13.9 5.3 13 5.8 12.5L13.8 3.2Z"
      fill="url(#bm-amber-grad)"
    />
    <path
      d="M18.2 28.8C17.6 29.5 16.5 29 16.7 28.1L19.1 18.5H14.8C14.1 18.5 13.7 17.6 14.2 17.1L22.2 7.8C22.8 7.1 23.9 7.6 23.7 8.5L21.3 18.1H25.6C26.3 18.1 26.7 19 26.2 19.5L18.2 28.8Z"
      fill="url(#bm-blue-grad)"
    />
  </svg>
);

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onGetStarted,
  isScrolled: externalIsScrolled,
}) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [internalScrolled, setInternalScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scrollParent = headerRef.current?.closest(".openedup-home") || window;
    const handleScroll = () => {
      const currentScroll =
        scrollParent === window
          ? window.scrollY
          : (scrollParent as HTMLElement).scrollTop;
      setInternalScrolled(currentScroll > 20);
    };

    scrollParent.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => scrollParent.removeEventListener("scroll", handleScroll);
  }, []);

  const isScrolled = externalIsScrolled !== undefined ? externalIsScrolled : internalScrolled;

  const handleStart = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigate("/chat");
    }
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (href.startsWith("/")) {
      e.preventDefault();
      navigate(href);
      setMobileMenuOpen(false);
    } else if (href.startsWith("#")) {
      if (window.location.pathname !== "/") {
        e.preventDefault();
        navigate("/" + href);
        setMobileMenuOpen(false);
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (window.location.pathname !== "/") {
      e.preventDefault();
      navigate("/");
    }
  };

  const navLinks = [
    { label: "About", href: "#top" },
    { label: "Insights", href: "/insights" },
    { label: "Docs", href: "/docs" },
  ];

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-[100] w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white/60 backdrop-blur-lg border-b border-black/5 shadow-xs"
          : "bg-transparent backdrop-blur-sm"
      }`}
    >
      <div className="relative flex h-[62px] sm:h-[68px] w-full items-center justify-between px-6 sm:px-8 lg:px-10">
        {/* Left: Brand Mark & SARA Wordmark */}
        <a
          href="#top"
          onClick={handleLogoClick}
          className="group flex items-center gap-2.5 text-black no-underline transition z-10"
          aria-label="SARA Home"
        >
          <img
            src="/logos/brand-logo.png"
            alt="Logo"
            className="h-[23px] w-[23px] object-contain transition-transform group-hover:scale-105"
          />
          <img
            src="/logos/sara.png"
            alt="SARA"
            className="h-[18px] sm:h-[19.5px] w-auto object-contain brightness-0 transition-opacity"
          />
        </a>

        {/* Center: Navigation Links (True absolute center across entire viewport) */}
        <nav
          aria-label="Primary navigation"
          className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-7 lg:gap-9 md:flex pointer-events-auto"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-[14.5px] lg:text-[15px] font-medium text-neutral-800 transition-colors hover:text-black no-underline whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Action Buttons (Snapped to right edge) */}
        <div className="hidden items-center gap-2.5 sm:flex z-10">
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex h-[38px] items-center justify-center rounded-full bg-black hover:bg-neutral-850 px-5 text-[13.5px] font-medium text-white transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle mobile menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-black md:hidden z-10"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-black/10 bg-white/95 px-6 py-5 backdrop-blur-xl md:hidden shadow-lg rounded-b-2xl">
          <nav className="flex flex-col gap-3.5">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-[14px] font-medium text-neutral-800 hover:text-black no-underline"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 flex flex-col gap-2 pt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleStart();
              }}
              className="flex h-10 w-full items-center justify-center rounded-full bg-black text-[13px] font-medium text-white shadow"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
