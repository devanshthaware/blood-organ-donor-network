"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Info,
    AlertTriangle,
    Workflow,
    Sparkles,
    Users,
    ShieldCheck,
    CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function LearnMoreModal({ children }: { children: React.ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden sm:rounded-2xl">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-red-500" />
                        VeinLink – Connecting Life, Predicting Blood
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[80vh] px-6 py-6">
                    <div className="space-y-8 pb-8">
                        {/* What is VeinLink? */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-red-400 font-semibold">
                                <Info size={18} />
                                <h3>What is VeinLink?</h3>
                            </div>
                            <p className="text-zinc-400 leading-relaxed">
                                VeinLink is an AI-assisted blood donation coordination platform that helps hospitals get the right blood, at the right time, from the right donors — without panic or donor fatigue.
                            </p>
                        </section>

                        {/* The Problem We Solve */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-red-400 font-semibold">
                                <AlertTriangle size={18} />
                                <h3>The Problem We Solve</h3>
                            </div>
                            <ul className="grid gap-3 text-zinc-400">
                                {[
                                    "Blood shortages are caused by poor coordination, not lack of donors",
                                    "Hospitals contact donors blindly, leading to low response rates",
                                    "Chronic patients (like thalassemia) suffer from last-minute delays",
                                    "No system predicts who will actually respond or when shortages will occur"
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-2 items-start text-sm">
                                        <div className="h-1.5 w-1.5 rounded-full bg-red-500/50 mt-1.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* How VeinLink Works */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-blue-400 font-semibold">
                                <Workflow size={18} />
                                <h3>How VeinLink Works</h3>
                            </div>
                            <div className="grid gap-4">
                                {[
                                    { title: "Hospitals Create Requests", desc: "Requests include exact timeline and urgency needs." },
                                    { title: "AI-Powered Matching", desc: "Predicts donor availability & reliability using historical behavior." },
                                    { title: "Smart Notifications", desc: "The best-matched donors are notified first, avoiding donor fatigue." },
                                    { title: "Automated Orchestration", desc: "Handles acceptance, rejections, and timeouts in real-time." },
                                    { title: "Continuous Learning", desc: "The system improves accuracy after every successful donation." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <div className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-200">{step.title}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* What Makes VeinLink Different */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-purple-400 font-semibold">
                                <Sparkles size={18} />
                                <h3>What Makes VeinLink Different</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { label: "Predictive Management", icon: "🔮" },
                                    { label: "Explainable AI Insights", icon: "🤖" },
                                    { label: "Reliability Scoring", icon: "🩸" },
                                    { label: "Hospital-Led Control", icon: "🏥" },
                                    { label: "Privacy-First Design", icon: "⚖️" }
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                                        <span className="text-xl">{feature.icon}</span>
                                        <span className="text-xs font-medium text-zinc-300">{feature.label}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Who Is It For? */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                                <Users size={18} />
                                <h3>Who Is It For?</h3>
                            </div>
                            <div className="space-y-2 text-sm text-zinc-400">
                                <p><strong className="text-emerald-400/80">Hospitals & Blood Banks</strong> – Better planning, fewer emergencies.</p>
                                <p><strong className="text-emerald-400/80">Donors</strong> – Fewer calls, more meaningful requests.</p>
                                <p><strong className="text-emerald-400/80">Patients</strong> – Reliable, timely transfusions.</p>
                            </div>
                        </section>

                        {/* Safety & Ethics */}
                        <section className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                            <div className="flex items-center gap-2 text-zinc-300 font-semibold text-sm">
                                <ShieldCheck size={16} className="text-zinc-500" />
                                <h4>Safety & Ethics</h4>
                            </div>
                            <p className="text-xs text-zinc-500 italic leading-relaxed">
                                AI in VeinLink never makes medical decisions. It only provides probability-based insights to support hospitals — all final authority remains with healthcare professionals.
                            </p>
                        </section>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-zinc-900 bg-zinc-950/50 flex justify-end">
                    <DialogTrigger asChild>
                        <Button variant="ghost" className="text-zinc-500 hover:text-white hover:bg-white/5">
                            Close
                        </Button>
                    </DialogTrigger>
                </div>
            </DialogContent>
        </Dialog>
    )
}
