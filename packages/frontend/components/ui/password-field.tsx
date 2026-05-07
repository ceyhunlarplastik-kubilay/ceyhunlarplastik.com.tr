"use client"

import { Eye, EyeOff, Sparkles } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type PasswordFieldProps = {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    showStrength?: boolean
    showChecklist?: boolean
    showGenerate?: boolean
    autoComplete?: string
}

const checks = [
    { key: "length", label: "En az 8 karakter", test: (value: string) => value.length >= 8 },
    { key: "upper", label: "En az 1 büyük harf", test: (value: string) => /[A-ZÇĞİÖŞÜ]/.test(value) },
    { key: "number", label: "En az 1 rakam", test: (value: string) => /\d/.test(value) },
    { key: "special", label: "En az 1 özel karakter", test: (value: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value) },
]

function generatePassword() {
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?"
    return Array.from({ length: 14 })
        .map(() => charset[Math.floor(Math.random() * charset.length)])
        .join("")
}

export function PasswordField({
    value,
    onChange,
    placeholder = "Şifrenizi girin",
    disabled,
    className,
    showStrength = true,
    showChecklist = false,
    showGenerate = false,
    autoComplete = "current-password",
}: PasswordFieldProps) {
    const [visible, setVisible] = useState(false)

    const status = useMemo(() => checks.map((item) => ({
        ...item,
        valid: item.test(value),
    })), [value])

    const passed = status.filter((item) => item.valid).length
    const progress = Math.max((passed / status.length) * 100, value ? 16 : 0)

    const strength = passed <= 1
        ? { label: "Zayıf", color: "bg-rose-500", text: "text-rose-600" }
        : passed === 2
            ? { label: "Orta", color: "bg-amber-500", text: "text-amber-600" }
            : passed === 3
                ? { label: "İyi", color: "bg-sky-500", text: "text-sky-600" }
                : { label: "Güçlü", color: "bg-emerald-600", text: "text-emerald-600" }

    return (
        <div className={cn("space-y-3", className)}>
            <div className="relative">
                <Input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    type={visible ? "text" : "password"}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    className="h-11 rounded-xl border-slate-200 bg-white pr-24"
                />

                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                    {showGenerate ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full text-slate-500 hover:text-slate-900"
                            onClick={() => onChange(generatePassword())}
                            disabled={disabled}
                        >
                            <Sparkles className="h-4 w-4" />
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full text-slate-500 hover:text-slate-900"
                        onClick={() => setVisible((current) => !current)}
                        disabled={disabled}
                    >
                        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {showStrength && value ? (
                <div className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={cn("h-full rounded-full transition-all duration-300", strength.color)} style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Şifre seviyesi</span>
                        <span className={cn("font-medium", strength.text)}>{strength.label}</span>
                    </div>
                </div>
            ) : null}

            {showChecklist ? (
                <div className="grid gap-2 sm:grid-cols-2">
                    {status.map((item) => (
                        <div
                            key={item.key}
                            className={cn(
                                "rounded-xl border px-3 py-2 text-xs transition-colors",
                                item.valid
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-50 text-slate-500"
                            )}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}
