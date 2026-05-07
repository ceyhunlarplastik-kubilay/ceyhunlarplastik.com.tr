import { AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "error" | "success" | "info"

type Props = {
    title: string
    description: string
    variant?: Variant
}

const styles: Record<Variant, string> = {
    error: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
}

const icons = {
    error: AlertTriangle,
    success: CheckCircle2,
    info: Info,
}

export function AuthFeedbackMessage({ title, description, variant = "info" }: Props) {
    const Icon = icons[variant]

    return (
        <div className={cn("rounded-2xl border px-4 py-3", styles[variant])}>
            <div className="flex items-start gap-3">
                <div className="rounded-full bg-white/70 p-2">
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <div className="text-sm font-semibold">{title}</div>
                    <p className="mt-1 text-sm leading-6 opacity-90">{description}</p>
                </div>
            </div>
        </div>
    )
}
