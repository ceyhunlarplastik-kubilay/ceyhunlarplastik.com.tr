"use client"

import { useRef, useState, type ReactNode } from "react"
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
    const [activeIndex, setActiveIndex] = useState(0)
    const boundedActiveIndex = Math.min(activeIndex, Math.max(contacts.length - 1, 0))

    function scrollToIndex(index: number) {
        const boundedIndex = Math.max(0, Math.min(index, contacts.length - 1))
        const target = itemRefs.current[boundedIndex]
        target?.scrollIntoView({
            behavior: "smooth",
            inline: "start",
            block: "nearest",
        })
        setActiveIndex(boundedIndex)
    }

    function handleScroll() {
        const scroller = scrollerRef.current
        if (!scroller) return

        const nextIndex = itemRefs.current.findIndex((item) => {
            if (!item) return false
            const midpoint = item.offsetLeft + item.offsetWidth / 2
            return midpoint >= scroller.scrollLeft + 24
        })

        if (nextIndex >= 0 && nextIndex !== activeIndex) {
            setActiveIndex(nextIndex)
        }
    }

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                    {eyebrow}
                </div>
                {contacts.length > 1 ? (
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-neutral-500">
                            {boundedActiveIndex + 1} / {contacts.length}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
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
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {contacts.map((contact, index) => (
                    <motion.div
                        key={contact.id}
                        ref={(node) => {
                            itemRefs.current[index] = node
                        }}
                        className="min-w-full snap-start"
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
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
