"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { cn } from "@/lib/utils"

function InputOTP({
    className,
    containerClassName,
    ...props
}: React.ComponentProps<typeof OTPInput> & {
    containerClassName?: string
}) {
    return (
        <OTPInput
            data-slot="input-otp"
            containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
            className={cn("w-full disabled:cursor-not-allowed", className)}
            {...props}
        />
    )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="input-otp-group"
            className={cn("flex items-center gap-2", className)}
            {...props}
        />
    )
}

function InputOTPSlot({
    index,
    className,
    ...props
}: React.ComponentProps<"div"> & {
    index: number
}) {
    const inputOTPContext = React.useContext(OTPInputContext)
    const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

    return (
        <div
            data-slot="input-otp-slot"
            data-active={isActive}
            className={cn(
                "relative flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base font-semibold text-slate-900 shadow-sm transition-all outline-none",
                "data-[active=true]:border-brand data-[active=true]:bg-brand/5 data-[active=true]:shadow-[0_0_0_4px_rgba(220,38,38,0.08)]",
                className
            )}
            {...props}
        >
            {char}
            {hasFakeCaret ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-px animate-caret-blink bg-slate-900 duration-1000" />
                </div>
            ) : null}
        </div>
    )
}

export { InputOTP, InputOTPGroup, InputOTPSlot }
