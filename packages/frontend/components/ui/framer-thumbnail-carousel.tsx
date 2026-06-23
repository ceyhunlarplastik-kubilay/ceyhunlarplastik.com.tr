"use client"

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { animate, motion, useMotionValue } from "motion/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FramerThumbnailCarouselItem = {
    id: string | number
    title: string
    description?: string | null
    imageUrl?: string | null
    eyebrow?: string | null
    badge?: ReactNode
}

type FramerThumbnailCarouselProps = {
    items: FramerThumbnailCarouselItem[]
    emptyTitle?: string
    emptyDescription?: string
    className?: string
    imagePresentation?: "cover" | "square"
    index?: number
    defaultIndex?: number
    onIndexChange?: (index: number) => void
}

const FULL_WIDTH_PX = 118
const COLLAPSED_WIDTH_PX = 38
const GAP_PX = 4
const MARGIN_PX = 2

const demoItems: FramerThumbnailCarouselItem[] = [
    {
        id: "demo-1",
        title: "Mobilya",
        description: "Profilinizle eşleşen kullanım alanları burada görselleştirilir.",
        imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=880&auto=format&fit=crop",
    },
    {
        id: "demo-2",
        title: "Çalışma Masası",
        description: "Kullanım alanı görseli yoksa kart kontrollü bir gradient fallback ile çalışır.",
        imageUrl: null,
    },
]

function useObservedWidth<T extends HTMLElement>(ref: RefObject<T | null>) {
    const [width, setWidth] = useState(0)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const updateWidth = () => {
            setWidth(element.offsetWidth || 0)
        }

        updateWidth()

        if (typeof ResizeObserver === "undefined") {
            return
        }

        const observer = new ResizeObserver(() => {
            updateWidth()
        })

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [ref])

    return width
}

export function FramerThumbnailCarousel({
    items,
    emptyTitle = "Henüz görsel veri yok",
    emptyDescription = "Bu alan için kayıt eklendiğinde burada kaydırmalı bir önizleme görünür.",
    className,
    imagePresentation = "cover",
    index: controlledIndex,
    defaultIndex = 0,
    onIndexChange,
}: FramerThumbnailCarouselProps) {
    const [uncontrolledIndex, setUncontrolledIndex] = useState(defaultIndex)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const containerWidth = useObservedWidth(containerRef)
    const x = useMotionValue(0)
    const maxIndex = Math.max(items.length - 1, 0)
    const isControlled = typeof controlledIndex === "number"
    const resolvedIndex = isControlled ? controlledIndex : uncontrolledIndex
    const activeIndex = Math.min(Math.max(resolvedIndex, 0), maxIndex)

    const setActiveIndex = (nextIndex: number) => {
        const clampedIndex = Math.min(Math.max(nextIndex, 0), maxIndex)

        if (!isControlled) {
            setUncontrolledIndex(clampedIndex)
        }

        onIndexChange?.(clampedIndex)
    }

    useEffect(() => {
        if (!isDragging && containerWidth > 0) {
            x.stop()
            animate(x, -activeIndex * containerWidth, {
                type: "spring",
                stiffness: 300,
                damping: 32,
            })
        }
    }, [activeIndex, containerWidth, isDragging, x])

    if (items.length === 0) {
        return (
            <div className={cn("rounded-[28px] border border-dashed border-slate-200 bg-slate-50/80 p-6", className)}>
                <div className="text-sm font-semibold text-slate-900">{emptyTitle}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{emptyDescription}</p>
            </div>
        )
    }

    return (
        <div className={cn("min-w-0 space-y-3", className)}>
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-sm" ref={containerRef}>
                <motion.div
                    className="flex min-w-0"
                    drag="x"
                    dragElastic={0.18}
                    dragMomentum={false}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={(_, info) => {
                        setIsDragging(false)
                        const offset = info.offset.x
                        const velocity = info.velocity.x
                        let nextIndex = activeIndex

                        if (Math.abs(velocity) > 500) {
                            nextIndex = velocity > 0 ? activeIndex - 1 : activeIndex + 1
                        } else if (containerWidth > 0 && Math.abs(offset) > containerWidth * 0.28) {
                            nextIndex = offset > 0 ? activeIndex - 1 : activeIndex + 1
                        }

                        setActiveIndex(nextIndex)
                    }}
                    style={{ x }}
                >
                    {items.map((item) => (
                        <div key={item.id} className="relative h-[310px] min-w-full shrink-0 basis-full overflow-hidden sm:h-[360px]">
                            {imagePresentation === "square" ? (
                                <div className="flex h-full min-w-0 flex-col items-center justify-center gap-6 bg-[radial-gradient(circle_at_top,rgba(214,179,93,0.18),transparent_28%),linear-gradient(160deg,#020617_0%,#111827_48%,#1e293b_100%)] px-5 py-6 text-center sm:px-8">
                                    <div className="relative aspect-square w-full max-w-[min(100%,28rem)] overflow-hidden rounded-[30px] border border-white/12 bg-white/5 p-3 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.65)] sm:max-w-[min(100%,32rem)] lg:max-w-[min(100%,28rem)]">
                                        {item.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.imageUrl}
                                                alt={item.title}
                                                className="h-full w-full select-none object-contain"
                                                draggable={false}
                                            />
                                        ) : (
                                            <div className="h-full w-full rounded-[22px] bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.42),transparent_34%),linear-gradient(135deg,#0f172a_0%,#334155_56%,#d6b35d_130%)]" />
                                        )}
                                        <div className="absolute inset-0 rounded-[30px] ring-1 ring-inset ring-white/10" />
                                    </div>

                                    <div className="max-w-xl text-white">
                                        <div className="flex flex-wrap items-center justify-center gap-2">
                                            {item.eyebrow ? (
                                                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/72 backdrop-blur">
                                                    {item.eyebrow}
                                                </span>
                                            ) : null}
                                            {item.badge}
                                        </div>
                                        <div className="mt-3 text-2xl font-semibold tracking-tight">{item.title}</div>
                                        {item.description ? (
                                            <p className="mt-2 text-sm leading-6 text-white/72">{item.description}</p>
                                        ) : null}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {item.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="h-full w-full select-none object-cover"
                                            draggable={false}
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.42),transparent_34%),linear-gradient(135deg,#0f172a_0%,#334155_56%,#d6b35d_130%)]" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/36 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {item.eyebrow ? (
                                                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/72 backdrop-blur">
                                                    {item.eyebrow}
                                                </span>
                                            ) : null}
                                            {item.badge}
                                        </div>
                                        <div className="mt-3 text-2xl font-semibold tracking-tight">{item.title}</div>
                                        {item.description ? (
                                            <p className="mt-2 max-w-xl text-sm leading-6 text-white/72">{item.description}</p>
                                        ) : null}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </motion.div>

                <CarouselButton
                    side="left"
                    disabled={activeIndex === 0}
                    onClick={() => setActiveIndex(activeIndex - 1)}
                />
                <CarouselButton
                    side="right"
                    disabled={activeIndex === items.length - 1}
                    onClick={() => setActiveIndex(activeIndex + 1)}
                />
            </div>

            <Thumbnails items={items} index={activeIndex} setIndex={setActiveIndex} />
        </div>
    )
}

function CarouselButton({
    side,
    disabled,
    onClick,
}: {
    side: "left" | "right"
    disabled: boolean
    onClick: () => void
}) {
    const Icon = side === "left" ? ChevronLeft : ChevronRight

    return (
        <Button
            type="button"
            size="icon"
            variant="secondary"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "absolute top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border border-white/20 bg-white/80 text-slate-900 shadow-lg backdrop-blur transition hover:bg-white",
                side === "left" ? "left-4" : "right-4",
                disabled && "opacity-40",
            )}
        >
            <Icon className="size-4" />
        </Button>
    )
}

function Thumbnails({
    items,
    index,
    setIndex,
}: {
    items: FramerThumbnailCarouselItem[]
    index: number
    setIndex: (index: number) => void
}) {
    const thumbnailsRef = useRef<HTMLDivElement | null>(null)
    const thumbnailsWidth = useObservedWidth(thumbnailsRef)

    useEffect(() => {
        if (!thumbnailsRef.current || thumbnailsWidth === 0) return

        let scrollPosition = 0
        for (let i = 0; i < index; i += 1) {
            scrollPosition += COLLAPSED_WIDTH_PX + GAP_PX
        }
        scrollPosition += MARGIN_PX
        scrollPosition -= thumbnailsWidth / 2 - FULL_WIDTH_PX / 2

        thumbnailsRef.current.scrollTo({ left: scrollPosition, behavior: "smooth" })
    }, [index, thumbnailsWidth])

    return (
        <div
            ref={thumbnailsRef}
            className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            <div className="flex h-20 gap-1 pb-2" style={{ width: "fit-content" }}>
                {items.map((item, itemIndex) => (
                    <motion.button
                        key={item.id}
                        type="button"
                        onClick={() => setIndex(itemIndex)}
                        initial={false}
                        animate={itemIndex === index ? "active" : "inactive"}
                        variants={{
                            active: {
                                width: FULL_WIDTH_PX,
                                marginLeft: MARGIN_PX,
                                marginRight: MARGIN_PX,
                            },
                            inactive: {
                                width: COLLAPSED_WIDTH_PX,
                                marginLeft: 0,
                                marginRight: 0,
                            },
                        }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="relative h-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                        aria-label={`${item.title} kullanım alanını göster`}
                    >
                        {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={item.imageUrl}
                                alt=""
                                className="h-full w-full select-none object-cover"
                                draggable={false}
                            />
                        ) : (
                            <div className="h-full w-full bg-[linear-gradient(135deg,#e2e8f0,#f8fafc,#d6b35d)]" />
                        )}
                        <div className={cn(
                            "absolute inset-0 border-2 transition",
                            itemIndex === index ? "border-amber-400" : "border-transparent",
                        )} />
                    </motion.button>
                ))}
            </div>
        </div>
    )
}

export function Component() {
    return <FramerThumbnailCarousel items={demoItems} />
}
