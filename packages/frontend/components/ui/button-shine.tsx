"use client"

import Link from "next/link"
import type { UrlObject } from "url"
import { Button } from "@/components/ui/button"

type Props = {
    href?: string | UrlObject
    children: React.ReactNode
    size?: "sm" | "lg" | "default"
    variant?: "default" | "outline" | "brand"
    className?: string
    onClick?: (e: React.MouseEvent) => void
}

export function ButtonShine({
    href,
    children,
    size = "sm",
    variant = "outline",
    className,
    onClick,
}: Props) {
    if (href) {
        return (
            <Button
                asChild
                size={size}
                variant={variant}
                onClick={onClick}
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
                <Link href={href}>{children}</Link>
            </Button>
        )
    }

    return (
        <Button
            size={size}
            variant={variant}
            onClick={onClick}
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