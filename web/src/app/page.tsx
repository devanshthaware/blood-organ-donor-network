"use client";

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Threads from "@/components/Threads"
import { ArrowRight, Instagram, Facebook, Twitter } from "lucide-react"
import { LearnMoreModal } from "@/components/landing/LearnMoreModal"
import CardNav from "@/components/CardNav"

export default function Home() {
  const [isCardNavOpen, setIsCardNavOpen] = useState(false);

  const navItems = [
    {
      label: "Portals",
      bgColor: "#f4f4f5",
      textColor: "#18181b",
      links: [
        { label: "Donor Portal", href: "/login/donor" },
        { label: "Hospital Portal", href: "/login/hospital" },
        { label: "Admin Portal", href: "/login/admin" }
      ]
    },
    {
      label: "Join Us",
      bgColor: "#fee2e2",
      textColor: "#991b1b",
      links: [
        { label: "Register as Donor", href: "/register/donor" },
        { label: "Register as Hospital", href: "/register/hospital" }
      ]
    },
    {
      label: "Resources",
      bgColor: "#e0f2fe",
      textColor: "#075985",
      links: [
        { label: "How it works", href: "#" },
        { label: "Community", href: "#" }
      ]
    }
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white selection:bg-primary selection:text-primary-foreground">

      {/* Industry-safe Fixed CardNav Wrapper */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <CardNav
            logo="/logo_red.png"
            logoAlt="VeinLink Logo"
            items={navItems}
            onToggle={setIsCardNavOpen}
            baseColor="rgba(0, 0, 0, 0.8)"
            menuColor="#fff"
            buttonBgColor="#ef4444"
            buttonTextColor="#fff"
          />
        </div>
      </div>

      {/* Background Animation */}
      <div className="absolute inset-0 z-0">
        <Threads
          color={[0.8, 0.2, 0.2]} // subtle red/pink for blood theme
          amplitude={1.5}
          distance={0}
          enableMouseInteraction={true}
        />
      </div>

      {/* Content Overlay */}
      <main className="relative z-10 flex flex-col items-center gap-8 px-4 text-center md:max-w-4xl pt-32 md:pt-40 pb-20">

        {/* Hero Title */}
        <h1 className="fade-in-up animate-in slide-in-from-bottom-4 duration-700 text-5xl font-extrabold tracking-tight sm:text-7xl md:text-8xl bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent drop-shadow-sm pb-2">
          Empowering Life Through <span className="text-red-500">Blood Donations</span>
        </h1>

        {/* Subtitle */}
        <p className="fade-in-up animate-in slide-in-from-bottom-8 duration-1000 delay-200 max-w-[42rem] text-lg leading-relaxed text-zinc-400 sm:text-xl md:leading-8">
          Connect donors and hospitals instantly with our intelligent, AI-assisted platform. Saving lives has never been more seamless.
        </p>

        {/* CTA Buttons */}
        <div className="fade-in-up animate-in slide-in-from-bottom-12 duration-1000 delay-500 mt-4 flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Button asChild size="lg" className="h-12 px-8 text-base shadow-lg shadow-red-500/20 transition-all hover:scale-105 hover:shadow-red-500/40">
            <Link href="/auth" className="flex items-center gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <LearnMoreModal>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white transition-all hover:scale-105">
              Learn More
            </Button>
          </LearnMoreModal>
        </div>

        {/* Social Icons */}
        <div className="fade-in-up animate-in slide-in-from-bottom-16 duration-1000 delay-700 mt-16 flex items-center justify-center gap-8 border-t border-white/10 pt-8">
          <a
            href="https://instagram.com/veinlink"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit VeinLink on Instagram"
            className="text-zinc-500 hover:text-pink-500 transition-colors hover:scale-110 duration-300"
          >
            <Instagram className="h-6 w-6" />
            <span className="sr-only">Instagram</span>
          </a>
          <a
            href="https://facebook.com/veinlink"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit VeinLink on Facebook"
            className="text-zinc-500 hover:text-blue-600 transition-colors hover:scale-110 duration-300"
          >
            <Facebook className="h-6 w-6" />
            <span className="sr-only">Facebook</span>
          </a>
          <a
            href="https://x.com/veinlink"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit VeinLink on X (Twitter)"
            className="text-zinc-500 hover:text-sky-500 transition-colors hover:scale-110 duration-300"
          >
            <Twitter className="h-6 w-6" />
            <span className="sr-only">Twitter</span>
          </a>
        </div>

      </main>

      {/* Decorative footer gradient */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-black to-transparent" />
    </div>
  )
}
