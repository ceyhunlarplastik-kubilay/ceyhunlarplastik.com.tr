"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { useInquiryCartStore } from "@/features/public/cart/store/useInquiryCartStore"
import { cn } from "@/lib/utils"

type Props = {
    className?: string
}

export function InquiryCartNavItem({ className }: Props) {
    const items = useInquiryCartStore((state) => state.items)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const totalCount = useMemo(
        () => items.reduce((acc, item) => acc + item.quantity, 0),
        [items]
    )

    return (
        <Link
            href="/sepet"
            className={cn(
                "inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50",
                className
            )}
            aria-label="Talep sepetine git"
        >
            <ShoppingCart className="h-4 w-4" />
            <span>Sepete Git</span>
            {mounted && totalCount > 0 && (
                <Badge
                    variant="secondary"
                    className="min-w-5 h-5 rounded-full px-1.5 text-[10px] font-semibold"
                >
                    {totalCount}
                </Badge>
            )}
        </Link>
    )
}
