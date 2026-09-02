"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowDown,
  ChevronUp,
  Heart,
  Building2,
  Shield,
  Activity,
  Zap,
  Radio,
  Lock,
  Stethoscope,
  Globe,
  Truck,
} from "lucide-react";
import { useVideoScrub } from "./hooks/useVideoScrub";

const DARK = "#1D3045";
const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260821_114821_a8ca298f-be2c-4613-a4dd-51b69e16bbde.mp4";

interface StaggerProps {
  visible: boolean;
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

function Stagger({ visible, delay = 0, children, className = "" }: StaggerProps) {
  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function App() {
  const {
    containerRef,
    videoRef,
    canvasRef,
    scrollProgress: p,
    canvasLive,
  } = useVideoScrub(VIDEO_SRC);

  const [navEntered, setNavEntered] = useState(false);

  // Entrance animation after 200ms
  useEffect(() => {
    const timer = setTimeout(() => setNavEntered(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Section Opacities derived directly from scroll progress p
  const s1Opacity = p < 0.2 ? 1 : Math.max(0, 1 - (p - 0.2) / 0.08);

  const s2Opacity =
    p < 0.32
      ? 0
      : p < 0.4
      ? (p - 0.32) / 0.08
      : p < 0.55
      ? 1
      : Math.max(0, 1 - (p - 0.55) / 0.08);

  const s3Opacity = p < 0.67 ? 0 : p < 0.75 ? (p - 0.67) / 0.08 : 1;

  // Stagger visibility threshold > 0.3
  const s1Visible = s1Opacity > 0.3;
  const s2Visible = s2Opacity > 0.3;
  const s3Visible = s3Opacity > 0.3;

  // Color flips at p > 0.55: DARK -> white (duration-500)
  const isDarkNav = p > 0.55;
  const navColor = isDarkNav ? "#ffffff" : DARK;

  const scrollToProgress = (targetP: number) => {
    if (!containerRef.current) return;
    const maxScroll = containerRef.current.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: targetP * maxScroll,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full bg-black text-white">
      {/* 1. Interactive Video Scrubbing Container */}
      <div
        ref={containerRef}
        className="relative h-[450vh] w-full select-none"
        style={{
          fontFamily:
            "'Helvetica Neue ME', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        {/* Inner Sticky Scene */}
        <div className="sticky top-0 w-full h-screen overflow-hidden">
          {/* <video> full cover */}
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* <canvas width=1920 height=1080> */}
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
              canvasLive ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Overlay containing Navbar + 3 sequential sections */}
          <div className="absolute inset-0 pointer-events-none">
            {/* NAVBAR */}
            <nav className="absolute top-0 left-0 right-0 z-50 pointer-events-auto px-6 sm:px-8 md:px-12 pt-8 sm:pt-12 pb-6 flex items-center justify-between">
              {/* Left: Brand logo */}
              <div
                style={{
                  opacity: navEntered ? 1 : 0,
                  transform: navEntered ? "translateY(0)" : "translateY(-12px)",
                  transition:
                    "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 100ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 100ms, color 500ms ease",
                  color: navColor,
                }}
              >
                <Link href="/" className="flex items-center gap-2 group">
                  <span className="text-base sm:text-lg tracking-[0.25em] uppercase font-bold transition-colors duration-500">
                    VEIN<span className="text-red-500">LINK</span>
                  </span>
                </Link>
              </div>

              {/* Right: Get Started button */}
              <div
                style={{
                  opacity: navEntered ? 1 : 0,
                  transform: navEntered ? "translateY(0)" : "translateY(-12px)",
                  transition:
                    "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 300ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 300ms",
                }}
              >
                <Link
                  href="/auth"
                  className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-lg shadow-red-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight size={15} />
                </Link>
              </div>
            </nav>

            {/* SECTION 1: Hero */}
            <div
              className="absolute inset-0 px-6 sm:px-8 md:px-20 lg:px-32 flex flex-col justify-center"
              style={{
                opacity: s1Opacity,
                transition: "opacity 0.1s ease-out",
                pointerEvents: s1Opacity > 0.05 ? "auto" : "none",
              }}
            >
              <div className="max-w-4xl">
                <Stagger visible={s1Visible} delay={0}>
                  <h1
                    className="font-light uppercase leading-[1.2]"
                    style={{
                      fontSize: "clamp(2rem, 5vw, 5rem)",
                      color: DARK,
                    }}
                  >
                    Empowering Life Through Blood Donations
                  </h1>
                </Stagger>

                <Stagger visible={s1Visible} delay={150}>
                  <p
                    className="mt-6 text-sm tracking-[0.3em] uppercase"
                    style={{ color: `${DARK}e6` }}
                  >
                    Intelligent, AI-Assisted Donor & Organ Network
                  </p>
                </Stagger>
              </div>

              {/* Bottom-right circle button */}
              <div className="absolute bottom-12 right-6 sm:right-8 md:right-12 pointer-events-auto">
                <Stagger visible={s1Visible} delay={300}>
                  <button
                    onClick={() => scrollToProgress(0.45)}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 cursor-pointer"
                    style={{
                      border: `1px solid ${DARK}80`,
                      color: DARK,
                    }}
                    aria-label="Scroll to next section"
                  >
                    <ArrowRight size={18} />
                  </button>
                </Stagger>
              </div>
            </div>

            {/* SECTION 2: Center */}
            <div
              className="absolute inset-0 px-6 sm:px-8 flex flex-col items-center justify-center"
              style={{
                opacity: s2Opacity,
                transition: "opacity 0.1s ease-out",
                pointerEvents: s2Opacity > 0.05 ? "auto" : "none",
              }}
            >
              <div className="max-w-[950px] mx-auto text-center">
                <Stagger visible={s2Visible} delay={0}>
                  <h2
                    className="font-extralight tracking-wide leading-[1.3] uppercase"
                    style={{
                      fontSize: "clamp(1.5rem, 4.5vw, 4.5rem)",
                      color: DARK,
                    }}
                  >
                    We predict critical shortages with vision{" "}
                    <span style={{ color: `${DARK}cc` }}>and precision</span>{" "}
                    <span style={{ color: `${DARK}80` }}>
                      saving lives across every hospital
                    </span>
                  </h2>
                </Stagger>
              </div>

              {/* Right column navigation controls */}
              <div className="absolute bottom-16 right-6 sm:right-8 md:right-12 flex flex-col items-center gap-4 pointer-events-auto">
                <Stagger visible={s2Visible} delay={200}>
                  <button
                    onClick={() => scrollToProgress(0.85)}
                    className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer"
                    style={{
                      border: `1px solid ${DARK}66`,
                      color: DARK,
                    }}
                    aria-label="Scroll to next section"
                  >
                    <ArrowDown size={18} />
                  </button>
                </Stagger>

                <Stagger visible={s2Visible} delay={350}>
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: DARK }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: `${DARK}66` }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: `${DARK}66` }}
                    />
                  </div>
                </Stagger>

                <Stagger visible={s2Visible} delay={500}>
                  <button
                    onClick={() => scrollToProgress(0)}
                    className="mt-2 w-10 h-10 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer"
                    style={{
                      border: `1px solid ${DARK}4d`,
                      color: `${DARK}cc`,
                    }}
                    aria-label="Scroll to top"
                  >
                    <ChevronUp size={16} />
                  </button>
                </Stagger>
              </div>
            </div>

            {/* SECTION 3: Right-aligned CTA */}
            <div
              className="absolute inset-0 px-6 sm:px-8 md:px-20 lg:px-32 flex items-center justify-end"
              style={{
                opacity: s3Opacity,
                transition: "opacity 0.1s ease-out",
                pointerEvents: s3Opacity > 0.05 ? "auto" : "none",
              }}
            >
              <div className="max-w-2xl text-left">
                <Stagger visible={s3Visible} delay={0}>
                  <p className="text-white/60 text-lg tracking-wide mb-4">
                    VeinLink Network
                  </p>
                </Stagger>

                <Stagger visible={s3Visible} delay={150}>
                  <h2
                    className="font-light text-white leading-[1.2] uppercase tracking-wide mb-8"
                    style={{ fontSize: "clamp(2rem, 4vw, 4rem)" }}
                  >
                    Saving lives,
                    <br />
                    shaping tomorrow.
                  </h2>
                </Stagger>

                <Stagger visible={s3Visible} delay={300}>
                  <div className="flex items-center gap-4 pointer-events-auto">
                    <Link
                      href="/auth"
                      className="text-sm tracking-[0.3em] text-white/80 uppercase hover:text-white transition-colors"
                    >
                      Get Started
                    </Link>
                    <Link
                      href="/auth"
                      className="w-10 h-10 rounded-full bg-white text-gray-800 flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-lg"
                      aria-label="Get Started"
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </Stagger>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FOOTER SECTION */}
      <footer className="relative z-30 bg-zinc-950 border-t border-zinc-800/80 px-6 sm:px-12 md:px-20 py-16 text-zinc-400">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
            {/* Column 1: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="text-xl tracking-[0.2em] uppercase font-bold text-white">
                  VEIN<span className="text-red-500">LINK</span>
                </span>
              </Link>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed">
                Next-generation intelligent donor matching, organ allocation review, and cold-chain logistics network powered by Convex, FastAPI, and cryptographic trust provenance.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                  <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> Real-Time Network Active
                </span>
              </div>
            </div>

            {/* Column 2: Donor Portal */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-500" /> Donor Portal
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/donor/dashboard" className="hover:text-white transition-colors">
                    Donor Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/donor/organ/opportunities" className="hover:text-white transition-colors">
                    Organ Opportunities
                  </Link>
                </li>
                <li>
                  <Link href="/donor/organ/preferences" className="hover:text-white transition-colors">
                    Living Evaluation Request
                  </Link>
                </li>
                <li>
                  <Link href="/donor/requests" className="hover:text-white transition-colors">
                    Blood Matches
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Hospital Operations */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" /> Hospital Portal
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/hospital/dashboard" className="hover:text-white transition-colors">
                    Hospital Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/hospital/emergency" className="hover:text-white transition-colors">
                    Emergency Center
                  </Link>
                </li>
                <li>
                  <Link href="/hospital/organs/requests" className="hover:text-white transition-colors">
                    Organ Requests
                  </Link>
                </li>
                <li>
                  <Link href="/hospital/organ-evaluations" className="hover:text-white transition-colors">
                    Evaluation Queue
                  </Link>
                </li>
                <li>
                  <Link href="/hospital/verification" className="hover:text-white transition-colors">
                    Donor Verifications
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Intelligence & Governance */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-500" /> Network Admin
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/admin/dashboard" className="hover:text-white transition-colors">
                    Admin Intelligence
                  </Link>
                </li>
                <li>
                  <Link href="/admin/automation" className="hover:text-white transition-colors">
                    n8n Automation Monitor
                  </Link>
                </li>
                <li>
                  <Link href="/admin/ai-monitor" className="hover:text-white transition-colors">
                    AI Telemetry Stream
                  </Link>
                </li>
                <li>
                  <Link href="/admin/blockchain" className="hover:text-white transition-colors">
                    Blockchain Trust Ledger
                  </Link>
                </li>
                <li>
                  <Link href="/admin/logistics" className="hover:text-white transition-colors">
                    Cold-Chain Logistics
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div>
              © 2026 VeinLink Healthcare Network. Built for emergency response & life preservation.
            </div>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" /> Zero-PHI On-Chain Integrity
              </span>
              <span className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-zinc-400" /> Clinical Oversight Invariant
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
