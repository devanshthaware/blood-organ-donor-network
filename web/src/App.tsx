"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export function App() {
  useEffect(() => {
    // Set document title
    document.title = "VeinLink — Decentralized Blood & Organ Donor Network";

    // Small IIFE for animation fallback & menu
    (function () {
      const appears = document.querySelectorAll(".appear, .hero-photo");

      // 1. Add .is-in on animationend
      appears.forEach((el) => {
        el.addEventListener(
          "animationend",
          () => {
            el.classList.add("is-in");
          },
          { once: true }
        );
      });

      // 2. JS fallback after two rAFs if animations are not running
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          let hasRunning = false;
          appears.forEach((el) => {
            const anims = (el as any).getAnimations ? (el as any).getAnimations() : [];
            if (anims.some((a: any) => a.playState === "running" || a.playState === "finished")) {
              hasRunning = true;
            }
          });
          if (!hasRunning) {
            appears.forEach((el) => el.classList.add("is-in"));
          }
        });
      });

      // 3. Burger menu toggle & Esc handler
      const burger = document.getElementById("burger-btn");
      const backdrop = document.querySelector(".menu-backdrop");
      const navLinks = document.querySelectorAll("#site-nav a");

      function toggleMenu(force?: boolean) {
        const nextState = force !== undefined ? force : !document.body.classList.contains("menu-open");
        if (nextState) {
          document.body.classList.add("menu-open");
          burger?.setAttribute("aria-expanded", "true");
          burger?.setAttribute("aria-label", "Close menu");
        } else {
          document.body.classList.remove("menu-open");
          burger?.setAttribute("aria-expanded", "false");
          burger?.setAttribute("aria-label", "Open menu");
        }
      }

      burger?.addEventListener("click", () => toggleMenu());
      backdrop?.addEventListener("click", () => toggleMenu(false));
      navLinks.forEach((link) => link.addEventListener("click", () => toggleMenu(false)));

      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") toggleMenu(false);
      });

      window.addEventListener("resize", () => {
        if (window.innerWidth >= 901) toggleMenu(false);
      });
    })();
  }, []);

  return (
    <div className="vesper-root" style={{ background: "#000", color: "#fff" }}>
      {/* Exact Google Fonts */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900&family=Instrument+Serif:ital@1&display=swap"
      />

      <style dangerouslySetInnerHTML={{ __html: `
        /* Force black immediately */
        html, body {
          background: #000000 !important;
          color: #ffffff;
        }
        html, body {
          background: #000000;
          background: var(--bg, #000000);
          color: #ffffff;
          color: var(--text, #ffffff);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          overflow-x: hidden;
          position: relative;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        html { scroll-behavior: smooth; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        button { font-family: inherit; }

        :root {
          --bg: #000000;
          --text: #ffffff;
          --muted: #9a9a9a;
          --stat: #d8d8d8;
          --border: rgba(255, 255, 255, 0.16);
          --border-soft: rgba(255, 255, 255, 0.12);

          --logo: 15.5px;
          --logo-mark: 22px;
          --nav: 14px;
          --nav-h: 40px;
          --btn: 13.5px;
          --btn-h: 40px;
          --hero-btn-h: 42px;
          --h1: 48px;
          --lede: 15.5px;
          --badge: 12.5px;
          --stat-size: 13.5px;
          --header-y: 22px;
          --header-x: 40px;
          --stats-x: 72px;
          --stats-y: 36px;
          --hero-gap: 85px;
          --copy-max: 860px;
          --lede-max: 520px;
        }

        /* Desktop Lock (≥901px) */
        @media (min-width: 901px) {
          html, body {
            height: 100%;
            overflow: hidden;
          }
          .page {
            height: 100vh;
            height: 100dvh;
            overflow: hidden;
          }
        }

        /* Background Video */
        .hero-photo {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
          opacity: 1;
          pointer-events: none;
        }

        .grain {
          position: fixed;
          inset: 0;
          z-index: 100;
          pointer-events: none;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        .page {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-rows: auto 1fr auto;
          min-height: 100vh;
          min-height: 100dvh;
        }

        /* Header */
        header.header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: var(--header-y) var(--header-x) 10px;
          z-index: 50;
          position: relative;
        }

        .logo {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          justify-self: start;
          font-size: var(--logo);
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #fff;
        }

        .logo-suffix {
          font-weight: 500;
          color: #ef4444;
        }

        #site-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-self: center;
        }

        /* Liquid-Metal Pill */
        .nav-pill {
          height: var(--nav-h);
          padding: 0 18px;
          border-radius: 7px;
          overflow: hidden;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(198,198,198,0.55);
          background: linear-gradient(105deg, #050505 0%, #2a2a2a 48%, #4a4a4a 100%);
          color: #f3f3f3;
          font-size: var(--nav);
          font-weight: 400;
          letter-spacing: -0.01em;
          white-space: nowrap;
          transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
        }

        .nav-pill::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.16) 50%, transparent 70%);
          transform: translateX(-120%);
          transition: transform 0.6s ease;
          pointer-events: none;
        }

        .nav-pill:hover::before {
          transform: translateX(120%);
        }

        .nav-pill:hover {
          border-color: rgba(235,235,235,0.9);
          background: linear-gradient(105deg, #111 0%, #3a3a3a 45%, #6a6a6a 100%);
          box-shadow: 0 0 18px rgba(200,210,230,0.18);
        }

        /* Buttons (Liquid-Glass Language) */
        .btn {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: var(--btn-h);
          padding: 0 16px;
          border-radius: 6px;
          font-size: var(--btn);
          font-weight: 500;
          letter-spacing: -0.02em;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.35s ease, border 0.35s ease, box-shadow 0.35s ease, color 0.35s ease, filter 0.35s ease;
        }

        .btn::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.45) 48%, transparent 76%);
          transform: translateX(-130%);
          transition: transform 0.65s ease;
          pointer-events: none;
        }

        .btn:hover::after {
          transform: translateX(130%);
        }

        .btn-solid {
          background: linear-gradient(180deg, #ffffff 0%, #e7e7e7 48%, #cfcfcf 100%);
          color: #111;
          border: 1px solid #fff;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.95);
        }

        .btn-solid:hover {
          background: linear-gradient(180deg, #fff 0%, #f3f6ff 42%, #d5def2 100%);
          border-color: #f2f6ff;
          box-shadow: inset 0 1px 0 #fff, 0 0 22px rgba(186,208,255,0.35), 0 8px 18px rgba(255,255,255,0.12);
        }

        .hero-actions .btn-solid:hover {
          box-shadow: inset 0 1px 0 #fff, 0 0 26px rgba(186,208,255,0.4), 0 8px 18px rgba(255,255,255,0.14);
        }

        .btn-ghost-hero {
          background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(0,0,0,0.5) 46%, rgba(150,170,200,0.1));
          color: #fff;
          border: 1px solid rgba(198,198,198,0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .btn-ghost-hero:hover {
          border-color: rgba(220,230,255,0.8);
          box-shadow: 0 0 24px rgba(170,200,255,0.28);
        }

        .header-cta {
          justify-self: end;
        }

        /* Burger button */
        .burger {
          display: none;
          width: 42px;
          height: 42px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: rgba(8,8,8,0.55);
          z-index: 60;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 5px;
          transition: border-color 0.25s ease, background 0.25s ease;
        }

        .burger:hover {
          border-color: rgba(255,255,255,0.32);
          background: rgba(255,255,255,0.05);
        }

        .burger span {
          display: block;
          width: 16px;
          height: 1.5px;
          background: #fff;
          border-radius: 1px;
          transition: transform 0.25s ease, opacity 0.2s ease;
        }

        body.menu-open .burger span:nth-child(1) {
          transform: translateY(6.5px) rotate(45deg);
        }
        body.menu-open .burger span:nth-child(2) {
          opacity: 0;
        }
        body.menu-open .burger span:nth-child(3) {
          transform: translateY(-6.5px) rotate(-45deg);
        }

        /* Menu Backdrop */
        .menu-backdrop {
          display: none;
        }

        /* Hero (Bottom-centered) */
        .hero {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 8px 24px var(--hero-gap);
          min-height: 0;
        }

        .hero-copy {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: var(--copy-max);
          width: 100%;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 22px;
          padding: 9px 15px;
          border: 0;
          border-radius: 5px;
          background: linear-gradient(90deg, #7d7d7d 0%, #2a2a2a 52%, #0a0a0a 100%);
          color: #f2f2f2;
          font-size: var(--badge);
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        .badge-star {
          filter: drop-shadow(0 0 3px rgba(255,255,255,0.45));
        }

        h1.headline {
          font-size: var(--h1);
          font-weight: 500;
          letter-spacing: -0.045em;
          line-height: 1.12;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .headline-line {
          display: block;
          overflow: hidden;
          padding: 0.06em 0.15em 0.14em;
        }

        h1 em {
          font-family: "Instrument Serif", "Times New Roman", Times, serif;
          font-style: italic;
          font-weight: 400;
          font-size: 1.08em;
          letter-spacing: -0.03em;
          color: #9a9a9a;
        }

        .lede {
          max-width: var(--lede-max);
          margin-top: 18px;
          color: #9a9a9a;
          font-size: var(--lede);
          font-weight: 400;
          line-height: 1.55;
          letter-spacing: -0.015em;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 26px;
        }

        .hero-actions .btn {
          height: var(--hero-btn-h);
          padding: 0 18px;
        }

        /* Stats Footer */
        .stats {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 0 var(--stats-x) var(--stats-y);
          padding-bottom: max(var(--stats-y), env(safe-area-inset-bottom));
          color: #d8d8d8;
        }

        .stat {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          font-size: var(--stat-size);
          letter-spacing: -0.015em;
          white-space: nowrap;
        }

        .stat-icon {
          width: 20px;
          height: 20px;
          color: #e8e8e8;
          flex-shrink: 0;
        }

        .stat-icon-wide {
          width: 38px;
          height: 21px;
          flex-shrink: 0;
        }

        /* Entrance Motion */
        .appear {
          opacity: 1;
          animation-duration: 1.05s;
          animation-fill-mode: both;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          animation-delay: var(--d, 0.08s);
        }

        .is-in {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
          clip-path: none !important;
          filter: none !important;
        }

        .appear--scale { animation-name: in-scale; }
        .appear--soft { animation-name: in-soft; }
        .appear--pop { animation-name: in-pop; }
        .appear--mask { animation-name: in-mask; }
        .appear--btn { animation-name: in-btn; }
        .appear--side { animation-name: in-side; }
        .appear--stat { animation-name: in-stat; }

        @keyframes in-scale {
          0% { opacity: 0; transform: scale(0.84); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes in-soft {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes in-pop {
          0% { opacity: 0; transform: scale(0.9); }
          70% { transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes in-mask {
          0% { opacity: 0; transform: translateY(40%); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes in-btn {
          0% { opacity: 0; transform: translateY(18px) scale(0.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes in-side {
          0% { opacity: 0; transform: translateX(22px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes in-stat {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes in-star {
          0% { opacity: 0; transform: scale(0.2) rotate(-50deg); }
          65% { transform: scale(1.2) rotate(8deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes in-em {
          0% { opacity: 0.35; filter: blur(4px); }
          100% { opacity: 1; filter: blur(0); }
        }

        .badge-star {
          animation: in-star 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.28s both;
        }

        h1 em {
          animation: in-em 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.72s both;
        }

        .lede.appear {
          animation-duration: 1.25s;
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            transition: none !important;
            animation: none !important;
          }
          .appear, .hero-photo, .hero h1 em, .badge-star {
            opacity: 1 !important;
            transform: none !important;
            clip-path: none !important;
            filter: none !important;
          }
        }

        /* Responsive Breakpoints */
        @media (min-width: 1600px) {
          :root {
            --logo: 17px;
            --logo-mark: 24px;
            --nav: 15px;
            --nav-h: 44px;
            --btn: 15px;
            --btn-h: 44px;
            --hero-btn-h: 48px;
            --h1: 64px;
            --lede: 18px;
            --badge: 13.5px;
            --stat-size: 15px;
            --header-y: 28px;
            --header-x: 64px;
            --stats-x: 96px;
            --stats-y: 44px;
            --copy-max: 980px;
            --lede-max: 580px;
          }
          .nav-pill { padding: 0 20px; }
          .badge { margin-bottom: 26px; }
          .lede { margin-top: 22px; }
          .hero-actions { margin-top: 30px; gap: 12px; }
          .stat-icon { width: 22px; height: 22px; }
          .stat-icon-wide { width: 45px; height: 24px; }
        }

        @media (min-width: 1920px) {
          :root {
            --logo: 18px;
            --logo-mark: 26px;
            --nav: 16px;
            --nav-h: 48px;
            --btn: 16px;
            --btn-h: 48px;
            --hero-btn-h: 52px;
            --h1: 76px;
            --lede: 20px;
            --badge: 14.5px;
            --stat-size: 16px;
            --header-y: 32px;
            --header-x: 80px;
            --stats-x: 120px;
            --stats-y: 52px;
            --copy-max: 1120px;
            --lede-max: 640px;
          }
          #site-nav { gap: 10px; }
          .nav-pill { padding: 0 22px; }
          .btn { padding: 0 22px; }
          .badge { padding: 10px 15px; }
          .stat-icon-wide { width: 48px; height: 26px; }
        }

        @media (min-width: 2560px) {
          :root {
            --h1: 88px;
            --lede: 22px;
            --header-x: 120px;
            --stats-x: 160px;
            --copy-max: 1280px;
            --lede-max: 700px;
          }
        }

        @media (min-width: 1280px) and (max-width: 1599px) {
          :root {
            --h1: 54px;
            --lede: 16px;
            --header-x: 48px;
            --stats-x: 80px;
            --copy-max: 900px;
          }
        }

        @media (min-width: 901px) and (max-width: 1279px) {
          :root {
            --logo: 15px;
            --nav: 13px;
            --nav-h: 36px;
            --btn: 13px;
            --btn-h: 38px;
            --hero-btn-h: 40px;
            --h1: 42px;
            --lede: 15px;
            --badge: 12px;
            --stat-size: 12.5px;
            --header-y: 16px;
            --header-x: 28px;
            --stats-x: 28px;
            --stats-y: 36px;
            --hero-gap: 64px;
            --copy-max: 760px;
            --lede-max: 460px;
          }
          .nav-pill { padding: 0 14px; }
          .badge { margin-bottom: 16px; }
          .lede { margin-top: 14px; }
          .hero-actions { margin-top: 20px; }
        }

        @media (min-width: 901px) and (max-height: 850px) {
          :root {
            --header-y: 14px;
            --stats-y: 24px;
            --hero-gap: 48px;
            --h1: 40px;
          }
          .badge { margin-bottom: 12px; }
          .lede { margin-top: 12px; }
          .hero-actions { margin-top: 16px; }
        }

        @media (min-width: 901px) and (max-height: 720px) {
          :root {
            --h1: 34px;
            --lede: 14px;
            --hero-gap: 32px;
            --stats-y: 18px;
            --nav-h: 30px;
            --btn-h: 34px;
            --hero-btn-h: 36px;
          }
          .badge { margin-bottom: 8px; }
        }

        /* Mobile (≤900px) */
        @media (max-width: 900px) {
          html, body {
            height: auto;
            overflow-y: auto;
          }
          header.header {
            grid-template-columns: 1fr auto auto;
            gap: 8px;
            padding: 16px 18px 10px;
          }
          .logo, .header-cta, .burger {
            z-index: 80;
          }
          .burger {
            display: inline-flex;
          }
          #site-nav {
            display: none;
          }
          .menu-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 40;
            background: rgba(8,8,8,0.42);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.28s ease, visibility 0.28s ease;
          }
          body.menu-open .menu-backdrop {
            opacity: 1;
            visibility: visible;
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
          body.menu-open #site-nav {
            display: flex;
            position: fixed;
            inset: 0;
            z-index: 45;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 12px;
            padding: 96px 22px 32px;
            padding-top: max(96px, calc(env(safe-area-inset-top) + 88px));
            background: transparent;
          }
          body.menu-open #site-nav .nav-pill {
            width: 100%;
            height: 56px;
            font-size: 19px;
            border-radius: 10px;
          }
          body.menu-open {
            overflow: hidden;
          }
          .hero {
            padding: 20px 20px 64px;
            align-items: flex-end;
          }
          .stats {
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 20px 28px;
            white-space: normal;
          }
          :root {
            --logo: 16px;
            --btn: 15px;
            --btn-h: 46px;
            --hero-btn-h: 48px;
            --h1: 36px;
            --lede: 16.5px;
            --badge: 13.5px;
            --stat-size: 15px;
            --hero-gap: 36px;
            --copy-max: 100%;
            --lede-max: 100%;
          }
        }

        @media (max-width: 560px) {
          :root {
            --h1: 34px;
            --lede: 16px;
            --header-x: 16px;
          }
          .hero-actions {
            flex-direction: column;
            width: 100%;
          }
          .hero-actions .btn {
            width: 100%;
          }
        }
      `}} />

      {/* 1. Grain overlay */}
      <div className="grain" />

      {/* 2. Hero video background 100% opacity no overlay */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="hero-photo"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260818_072341_50851634-bbc3-4c33-9acc-7647d4db44aa.mp4"
      />

      {/* 3. Page Structure */}
      <div className="page">
        {/* Mobile menu backdrop */}
        <div className="menu-backdrop" />

        {/* HEADER */}
        <header className="header">
          {/* Left: Brand Logo */}
          <Link
            href="#top"
            className="logo appear appear--scale"
            style={{ ["--d" as any]: "0.08s" }}
            aria-label="VeinLink Network"
          >
            <svg
              className="logo-mark"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <g transform="rotate(-30 12 12)">
                <circle cx="7.3" cy="3.2" r="1.45" />
                <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <circle cx="16.7" cy="20.8" r="1.45" />
              </g>
            </svg>
            <span>
              Vein<span className="logo-suffix">Link</span>
            </span>
          </Link>

          {/* Center: Nav Pills */}
          <nav id="site-nav" aria-label="Primary">
            <Link
              href="/donor/dashboard"
              className="nav-pill appear appear--scale"
              style={{ ["--d" as any]: "0.16s" }}
            >
              Donor Network
            </Link>
            <Link
              href="/hospital/dashboard"
              className="nav-pill appear appear--soft"
              style={{ ["--d" as any]: "0.28s" }}
            >
              Hospital Portal
            </Link>
            <Link
              href="/admin/ai-monitor"
              className="nav-pill appear appear--scale"
              style={{ ["--d" as any]: "0.40s" }}
            >
              AI Allocation
            </Link>
            <Link
              href="/admin/blockchain"
              className="nav-pill appear appear--soft"
              style={{ ["--d" as any]: "0.52s" }}
            >
              Trust Ledger
            </Link>
          </nav>

          {/* Right: CTA & Burger */}
          <div style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: "8px" }}>
            <Link
              href="/auth"
              className="btn btn-solid header-cta appear appear--scale"
              style={{ ["--d" as any]: "0.34s" }}
            >
              Get Started
            </Link>

            <button
              id="burger-btn"
              className="burger appear appear--scale"
              style={{ ["--d" as any]: "0.34s" }}
              aria-controls="site-nav"
              aria-expanded="false"
              aria-label="Open menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </header>

        {/* HERO (Bottom-centered) */}
        <main className="hero" id="top">
          <div className="hero-copy">
            {/* Badge */}
            <div
              className="badge appear appear--pop"
              style={{ ["--d" as any]: "0.22s" }}
            >
              <svg
                className="badge-star"
                width="18"
                height="20"
                viewBox="0 0 24 24"
                fill="white"
              >
                <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
              </svg>
              <span>Decentralized Blood & Organ Trust Network</span>
            </div>

            {/* H1 */}
            <h1 className="headline">
              <span
                className="headline-line appear appear--mask"
                style={{ ["--d" as any]: "0.42s" }}
              >
                Connecting <em>life donors</em> with
              </span>
              <span
                className="headline-line appear appear--mask"
                style={{ ["--d" as any]: "0.62s" }}
              >
                transplant centers in seconds.
              </span>
            </h1>

            {/* Lede */}
            <p
              className="lede appear appear--soft"
              style={{ ["--d" as any]: "0.82s" }}
            >
              Intelligent real-time donor matching, Pareto-optimized organ allocation, and cold-chain logistics powered by zero-knowledge trust.
            </p>

            {/* Actions */}
            <div className="hero-actions">
              <Link
                href="/auth"
                className="btn btn-solid appear appear--btn"
                style={{ ["--d" as any]: "0.96s" }}
              >
                Join as Donor
              </Link>
              <Link
                href="/auth"
                className="btn btn-ghost-hero appear appear--side"
                style={{ ["--d" as any]: "1.10s" }}
              >
                Hospital & Admin Portal
              </Link>
            </div>
          </div>
        </main>

        {/* STATS FOOTER */}
        <footer className="stats">
          {/* Stat 1: Verified Matches */}
          <div
            className="stat appear appear--stat"
            style={{ ["--d" as any]: "1.12s" }}
          >
            <svg className="stat-icon" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="grad-pill-left" x1="3" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="grad-pill-right" x1="13" y1="2" x2="24" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.62" />
                </linearGradient>
              </defs>
              <rect x="3.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#grad-pill-left)" />
              <rect x="13.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#grad-pill-right)" />
              <rect x="9.2" y="10.9" width="5.6" height="2.2" rx="1.1" fill="#4a4a4a" />
            </svg>
            <span>100% Verified Clinical Donor Matches</span>
          </div>

          {/* Stat 2: Emergency Response */}
          <div
            className="stat appear appear--stat"
            style={{ ["--d" as any]: "1.28s" }}
          >
            <svg className="stat-icon" viewBox="0 0 24 24">
              <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="6.2" fill="#ffffff" />
              <path d="M12 7.1v7.4" stroke="#111" strokeWidth="1.85" strokeLinecap="round" />
              <path d="M8.15 12.35L12 16.2l3.85-3.85" fill="none" stroke="#111" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>94% Faster Emergency Response Time</span>
          </div>

          {/* Stat 3: Accredited Hospitals */}
          <div
            className="stat appear appear--stat"
            style={{ ["--d" as any]: "1.44s" }}
          >
            <svg className="stat-icon-wide" viewBox="0 0 40 22">
              <circle cx="10.2" cy="11" r="9.2" fill="#2b2b2b" />
              <ellipse cx="10.2" cy="12.1" rx="4.15" ry="3.7" fill="#f4f4f4" />
              <circle cx="8.6" cy="11.2" r="0.7" fill="#1a1a1a" />
              <circle cx="11.8" cy="11.2" r="0.7" fill="#1a1a1a" />

              <circle cx="20.2" cy="11" r="9.2" fill="#ffffff" />
              <circle cx="18.2" cy="9.8" r="1.7" fill="#111111" />
              <circle cx="22.2" cy="9.8" r="1.7" fill="#111111" />
              <path d="M18.8 14.5c.8.8 2 .8 2.8 0" fill="none" stroke="#111" strokeWidth="1.2" strokeLinecap="round" />

              <circle cx="30.2" cy="11" r="9.2" fill="#ef4444" />
              <text x="30.2" y="15.1" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="Inter, sans-serif">+</text>
            </svg>
            <span>250+ Accredited Hospitals & Organ Centers</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
