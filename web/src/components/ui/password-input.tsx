"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export function PasswordInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    const [show, setShow] = useState(false);

    return (
        <div className="relative w-full">
            <Input
                {...props}
                type={show ? "text" : "password"}
                className={cn("pr-10", className)}
            />

            <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                aria-label={show ? "Hide password" : "Show password"}
            >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}
