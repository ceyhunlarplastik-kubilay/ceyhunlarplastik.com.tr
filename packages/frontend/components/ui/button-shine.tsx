"use client"

import type { UrlObject } from "url"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"

/**
 * next/link DEĞİL, @/i18n/navigation Link kullanılıyor: bu buton [locale]
 * ağacındaki public sayfalarda da (ör. ProductVariantTable "Varyantları göster")
 * kullanılıyor ve ham next/link mutlak path'i olduğu gibi bıraktığı için
 * /de/urun/... sayfasından tıklandığında locale prefix'i düşüyordu.
 * Panellerde ((panels) ağacı) locale i18n/request.ts tarafından tr'ye
 * sabitlendiğinden ve localePrefix "as-needed" olduğundan panel path'leri
 * prefixsiz kalmaya devam eder; dış URL'lere de next-intl dokunmaz.
 */

type Props = {
    href?: string | UrlObject
    children: React.ReactNode
    size?: "sm" | "lg" | "default"
    variant?: "default" | "outline" | "brand"
    className?: string
    onClick?: (e: React.MouseEvent) => void
    type?: "button" | "submit" | "reset"
    disabled?: boolean
    ariaLabel?: string
    target?: React.ComponentProps<typeof Link>["target"]
    rel?: string
}

export function ButtonShine({
    href,
    children,
    size = "sm",
    variant = "outline",
    className,
    onClick,
    type = "button",
    disabled = false,
    ariaLabel,
    target,
    rel,
}: Props) {
    if (href) {
        return (
            <Button
                asChild
                size={size}
                variant={variant}
                onClick={onClick}
                type={type}
                disabled={disabled}
                aria-label={ariaLabel}
                className={`
                    relative overflow-hidden
                    bg-[var(--color-brand)] text-white
                    hover:bg-[var(--color-brand)]
                    ${className}

                    before:absolute before:inset-0 before:rounded-[inherit]
                    before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.6)_50%,transparent_75%)]
                    before:bg-[length:250%_250%]
                    before:bg-[position:200%_0]
                    before:bg-no-repeat
                    before:transition-[background-position]
                    before:duration-700
                    hover:before:bg-[position:-100%_0]
                `}
            >
                <Link href={href} target={target} rel={rel}>{children}</Link>
            </Button>
        )
    }

    return (
        <Button
            size={size}
            variant={variant}
            onClick={onClick}
            type={type}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`
                relative overflow-hidden
                bg-[var(--color-brand)] text-white
                hover:bg-[var(--color-brand)]
                ${className}

                before:absolute before:inset-0 before:rounded-[inherit]
                before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.6)_50%,transparent_75%)]
                before:bg-[length:250%_250%]
                before:bg-[position:200%_0]
                before:bg-no-repeat
                before:transition-[background-position]
                before:duration-700
                hover:before:bg-[position:-100%_0]
            `}
        >
            {children}
        </Button>
    )
}
