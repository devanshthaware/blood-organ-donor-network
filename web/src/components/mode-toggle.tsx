"use client"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { cn } from "@/lib/utils"

export function ModeToggle({ className }: { className?: string }) {
    return <AnimatedThemeToggler className={cn("border-none bg-transparent shadow-none", className)} />
}
