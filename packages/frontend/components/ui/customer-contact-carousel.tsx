"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { motion } from "motion/react"
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserContactCard } from "@/components/ui/user-contact-card"
import type { CustomerContactCardModel } from "@/lib/customers/contactCards"
import { cn } from "@/lib/utils"

type CustomerContactCarouselItem = CustomerContactCardModel & {
    description?: string | null
    badge?: ReactNode
}

type CustomerContactCarouselProps = {
    contacts: CustomerContactCarouselItem[]
    eyebrow: string
    icon: LucideIcon
    size?: "default" | "compact"
    className?: string
}

export function CustomerContactCarousel({
    contacts,
    eyebrow,
    icon,
    size = "default",
    className,
}: CustomerContactCarouselProps) {
    const scrollerRef = useRef<HTMLDivElement | null>(null)
    const itemRefs = useRef<Array<HTMLDivElement | null>>([])
    const scrollFrameRef = useRef<number | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const boundedActiveIndex = Math.min(activeIndex, Math.max(contacts.length - 1, 0))

    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, contacts.length)
    }, [contacts.length])

    useEffect(() => {
        return () => {
            if (scrollFrameRef.current !== null) {
                window.cancelAnimationFrame(scrollFrameRef.current)
            }
        }
    }, [])

    function resolveClosestIndex() {
        const scroller = scrollerRef.current
        if (!scroller || contacts.length === 0) return 0

        const scrollerRect = scroller.getBoundingClientRect()
        const scrollerCenter = scrollerRect.left + scrollerRect.width / 2
        let nextIndex = 0
        let smallestDistance = Number.POSITIVE_INFINITY

        itemRefs.current.forEach((item, index) => {
            if (!item) return

            const itemRect = item.getBoundingClientRect()
            const itemCenter = itemRect.left + itemRect.width / 2
            const distance = Math.abs(itemCenter - scrollerCenter)

            if (distance < smallestDistance) {
                smallestDistance = distance
                nextIndex = index
            }
        })

        return Math.max(0, Math.min(nextIndex, contacts.length - 1))
    }

    function scrollToIndex(index: number) {
        const boundedIndex = Math.max(0, Math.min(index, contacts.length - 1))
        const scroller = scrollerRef.current
        const target = itemRefs.current[boundedIndex]
        if (scroller && target) {
            const scrollerRect = scroller.getBoundingClientRect()
            const targetRect = target.getBoundingClientRect()
            scroller.scrollTo({
                left: scroller.scrollLeft + targetRect.left - scrollerRect.left,
                behavior: "smooth",
            })
        }
        setActiveIndex(boundedIndex)
    }

    function handleScroll() {
        if (scrollFrameRef.current !== null) {
            window.cancelAnimationFrame(scrollFrameRef.current)
        }

        scrollFrameRef.current = window.requestAnimationFrame(() => {
            scrollFrameRef.current = null
            const nextIndex = resolveClosestIndex()
            setActiveIndex((current) => current === nextIndex ? current : nextIndex)
        })
    }

    return (
        <div
            className={cn("flex h-full flex-col space-y-3", className)}
            role="region"
            aria-label={eyebrow}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                    {eyebrow}
                </div>
                {contacts.length > 1 ? (
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-neutral-500" aria-live="polite">
                            {boundedActiveIndex + 1} / {contacts.length}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Önceki kişiyi göster"
                            className="size-8 rounded-full"
                            onClick={() => scrollToIndex(boundedActiveIndex - 1)}
                            disabled={boundedActiveIndex <= 0}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Sonraki kişiyi göster"
                            className="size-8 rounded-full"
                            onClick={() => scrollToIndex(boundedActiveIndex + 1)}
                            disabled={boundedActiveIndex >= contacts.length - 1}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                ) : null}
            </div>

            <div
                ref={scrollerRef}
                onScroll={handleScroll}
                className="flex flex-1 snap-x snap-mandatory items-stretch gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {contacts.map((contact, index) => (
                    <motion.div
                        key={contact.id}
                        ref={(node) => {
                            itemRefs.current[index] = node
                        }}
                        className="h-full min-w-full snap-start"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut", delay: index * 0.04 }}
                    >
                        <UserContactCard
                            eyebrow={eyebrow}
                            icon={icon}
                            name={contact.name}
                            roleLabel={contact.roleLabel}
                            subtitle={contact.subtitle}
                            description={contact.description}
                            email={contact.email}
                            phone={contact.phone}
                            imageUrl={contact.imageUrl}
                            badge={contact.badge}
                            size={size}
                            className="h-full"
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
