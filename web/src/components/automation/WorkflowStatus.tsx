"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    Flame,
    RotateCw,
    ShieldAlert,
    Stethoscope,
    XCircle,
} from "lucide-react"

export type WorkflowStatusState =
    | "IDLE"
    | "QUEUED"
    | "RUNNING"
    | "WAITING"
    | "COMPLETED"
    | "FAILED"
    | "ESCALATED"
    | "HUMAN_REVIEW"

interface WorkflowStatusProps {
    workflowName?: string
    status: WorkflowStatusState
    correlationId?: string
    message?: string
    compact?: boolean
    className?: string
}

export function WorkflowStatus({
    workflowName,
    status,
    correlationId,
    message,
    compact = false,
    className = "",
}: WorkflowStatusProps) {
    const getStatusConfig = () => {
        switch (status) {
            case "RUNNING":
                return {
                    label: "Coordination Running",
                    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
                    icon: RotateCw,
                    iconClass: "animate-spin text-blue-400",
                }
            case "QUEUED":
                return {
                    label: "Queued for Automation",
                    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
                    icon: Clock,
                    iconClass: "text-amber-400",
                }
            case "WAITING":
                return {
                    label: "Awaiting Response",
                    color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
                    icon: Activity,
                    iconClass: "text-purple-400",
                }
            case "HUMAN_REVIEW":
                return {
                    label: "Human Review Required",
                    color: "bg-orange-500/10 text-orange-400 border-orange-500/30",
                    icon: Stethoscope,
                    iconClass: "text-orange-400",
                }
            case "ESCALATED":
                return {
                    label: "Emergency Escalated",
                    color: "bg-red-500/10 text-red-400 border-red-500/30",
                    icon: Flame,
                    iconClass: "text-red-500 animate-pulse",
                }
            case "COMPLETED":
                return {
                    label: "Workflow Completed",
                    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                    icon: CheckCircle2,
                    iconClass: "text-emerald-400",
                }
            case "FAILED":
                return {
                    label: "Workflow Error",
                    color: "bg-red-500/10 text-red-400 border-red-500/30",
                    icon: XCircle,
                    iconClass: "text-red-400",
                }
            case "IDLE":
            default:
                return {
                    label: "Idle",
                    color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
                    icon: Activity,
                    iconClass: "text-zinc-500",
                }
        }
    }

    const config = getStatusConfig()
    const Icon = config.icon

    if (compact) {
        return (
            <Badge variant="outline" className={`text-[10px] font-semibold flex items-center gap-1.5 py-0.5 px-2 ${config.color} ${className}`}>
                <Icon className={`w-3 h-3 ${config.iconClass}`} />
                <span>{config.label}</span>
                {correlationId && <span className="font-mono opacity-60 text-[9px]">({correlationId})</span>}
            </Badge>
        )
    }

    return (
        <div className={`p-3 rounded-xl border ${config.color} flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${className}`}>
            <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-background/50 border border-current/20">
                    <Icon className={`w-4 h-4 ${config.iconClass}`} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        {workflowName && <strong className="font-bold text-foreground">{workflowName}</strong>}
                        <Badge variant="outline" className={`text-[10px] uppercase font-mono ${config.color}`}>
                            {config.label}
                        </Badge>
                    </div>
                    {message && <p className="text-[11px] text-muted-foreground mt-0.5">{message}</p>}
                </div>
            </div>

            {correlationId && (
                <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 shrink-0 self-start sm:self-center">
                    <span>Trace:</span>
                    <span className="font-semibold text-foreground px-1.5 py-0.5 rounded bg-background/80 border border-border/50">
                        {correlationId}
                    </span>
                </div>
            )}
        </div>
    )
}
