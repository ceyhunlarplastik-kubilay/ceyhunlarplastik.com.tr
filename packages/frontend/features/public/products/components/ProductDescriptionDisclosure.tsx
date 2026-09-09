"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type Props = {
    description: string
    productName: string
}

/** Keep the overview balanced while retaining the complete description in its server HTML. */
export default function ProductDescriptionDisclosure({ description, productName }: Props) {
    const t = useTranslations("public.productDetail")
    const previewRef = useRef<HTMLParagraphElement>(null)
    const readingRef = useRef<HTMLParagraphElement>(null)
    const [hasOverflow, setHasOverflow] = useState<boolean | null>(null)

    useEffect(() => {
        const preview = previewRef.current
        if (!preview) return

        const observer = new ResizeObserver(() => {
            setHasOverflow(preview.scrollHeight > preview.clientHeight + 1)
        })
        observer.observe(preview)

        return () => observer.disconnect()
    }, [description])

    return (
        <div className="flex w-full max-w-[65ch] flex-col items-start gap-1">
            <p
                ref={previewRef}
                tabIndex={hasOverflow === null ? 0 : undefined}
                className={cn(
                    "max-h-24 w-full whitespace-pre-line wrap-break-word text-sm leading-6 text-muted-foreground",
                    // Before hydration (and without JavaScript), the full text remains scrollable.
                    hasOverflow === null ? "overflow-y-auto" : "line-clamp-4",
                )}
            >
                {description}
            </p>

            {hasOverflow ? (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="-ms-2.5">
                            {t("usage.readMore")}
                            <ArrowUpRight data-icon="inline-end" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent
                        aria-describedby={undefined}
                        className="max-h-[calc(100dvh-2rem)] gap-5 sm:max-w-2xl motion-reduce:animate-none"
                        onOpenAutoFocus={(event) => {
                            event.preventDefault()
                            readingRef.current?.focus()
                        }}
                    >
                        <DialogHeader className="pe-6">
                            <DialogTitle>{productName}</DialogTitle>
                        </DialogHeader>
                        <p
                            ref={readingRef}
                            tabIndex={0}
                            role="region"
                            aria-label={productName}
                            className="max-h-[60dvh] overflow-y-auto overscroll-contain whitespace-pre-line wrap-break-word pe-3 text-sm leading-7 text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
                        >
                            {description}
                        </p>
                    </DialogContent>
                </Dialog>
            ) : null}
        </div>
    )
}
