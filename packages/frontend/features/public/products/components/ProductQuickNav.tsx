import { useTranslations } from "next-intl"
import { Box, Boxes, Clapperboard, Paperclip, Play, Ruler } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
    className?: string
    variant?: "grid" | "strip"
}

export default function ProductQuickNav({ className, variant = "grid" }: Props) {
    const t = useTranslations("public.productDetail.quickNav")
    const items = [
        { icon: Ruler, label: t("dimensions"), target: "product-variants" },
        { icon: Boxes, label: t("industrialAreas"), target: "usage-area-table" },
        { icon: Box, label: t("model3d"), target: "product-3d-model" },
        { icon: Play, label: t("assemblyVideo"), target: "product-assembly-video" },
        { icon: Clapperboard, label: t("promoVideo"), target: "product-promo-video" },
        { icon: Paperclip, label: t("certificate"), target: "product-certificate" },
    ]

    return (
        <nav className={cn("w-full", variant === "grid" && "mt-6", className)}>
            <div className={cn(
                "grid overflow-hidden rounded-xl border border-border bg-muted/40",
                variant === "strip" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6" : "grid-cols-3",
            )}>
                {items.map(({ icon: Icon, label, target }) => (
                    <a
                        key={target}
                        href={`#${target}`}
                        className={cn(
                            "flex min-w-0 items-center justify-center gap-2 px-3 py-4 text-center text-xs font-medium text-foreground outline-none transition-colors hover:bg-brand/10 focus-visible:bg-brand/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                            variant === "grid" && "flex-col",
                        )}
                    >
                        <Icon className={cn("shrink-0 text-brand", variant === "strip" ? "size-4 lg:size-12" : "size-7")} strokeWidth={2} aria-hidden="true" />
                        <span>{label}</span>
                    </a>
                ))}
            </div>
        </nav>
    )
}
