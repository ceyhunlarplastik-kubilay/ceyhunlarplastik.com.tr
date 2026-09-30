import { CircleCheck, CircleHelp, CircleX, TriangleAlert, type LucideIcon } from "lucide-react"

import type { CompatibilityLevel } from "@core/helpers/production/moldMachineCompatibility"

/** Hüküm gösterimi — renk tek başına bilgi taşımaz: ikon + etiket birlikte kullanılır. */
export const COMPATIBILITY_LEVEL_META: Record<CompatibilityLevel, {
    label: string
    icon: LucideIcon
    className: string
}> = {
    ok: {
        label: "Uygun",
        icon: CircleCheck,
        className: "text-emerald-600 dark:text-emerald-400",
    },
    warning: {
        label: "Dikkat",
        icon: TriangleAlert,
        className: "text-amber-600 dark:text-amber-400",
    },
    unknown: {
        label: "Eksik bilgi",
        icon: CircleHelp,
        className: "text-muted-foreground",
    },
    error: {
        label: "Uygun değil",
        icon: CircleX,
        className: "text-red-600 dark:text-red-400",
    },
}

export const COMPATIBILITY_LEVEL_ORDER: CompatibilityLevel[] = ["ok", "warning", "unknown", "error"]
