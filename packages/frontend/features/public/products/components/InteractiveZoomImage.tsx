"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Props = {
    src: string
    alt: string
    compact?: boolean
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export default function InteractiveZoomImage({ src, alt, compact = false }: Props) {
    const [open, setOpen] = useState(false)
    const [hoverOrigin, setHoverOrigin] = useState({ x: 50, y: 50 })
    const [isHovering, setIsHovering] = useState(false)

    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [dragging, setDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    const viewportRef = useRef<HTMLDivElement | null>(null)

    const previewScale = isHovering ? 1.9 : 1

    const zoomTransform = useMemo(
        () => `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        [pan.x, pan.y, zoom]
    )

    const resetDialogTransform = () => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect()
                    const x = ((event.clientX - rect.left) / rect.width) * 100
                    const y = ((event.clientY - rect.top) / rect.height) * 100
                    setHoverOrigin({ x: clamp(x, 0, 100), y: clamp(y, 0, 100) })
                }}
                className="group relative h-full w-full overflow-hidden"
                aria-label="Teknik çizimi büyüt"
            >
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className={`object-contain transition-transform duration-200 ease-out ${compact ? "p-2" : "p-3"}`}
                    style={{
                        transformOrigin: `${hoverOrigin.x}% ${hoverOrigin.y}%`,
                        transform: `scale(${previewScale})`,
                    }}
                    sizes="(min-width: 1024px) 60vw, 100vw"
                />

                <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
                <div className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <Maximize2 className="h-3 w-3" />
                    Büyüt
                </div>
            </button>

            <Dialog
                open={open}
                onOpenChange={(next) => {
                    setOpen(next)
                    if (!next) resetDialogTransform()
                }}
            >
                <DialogContent
                    showCloseButton={false}
                    className="h-[90vh] w-[95vw] max-w-[1400px] overflow-hidden p-0"
                >
                    <DialogTitle className="sr-only">Teknik Çizim Büyütme</DialogTitle>

                    <div className="flex h-full flex-col bg-neutral-100">
                        <div className="flex items-center justify-between border-b border-neutral-800/20 bg-neutral-900 px-4 py-3 text-white">
                            <p className="text-sm font-medium">Teknik Çizim İnceleme</p>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 bg-white/10 text-white hover:bg-white/20"
                                    onClick={() => setZoom((current) => clamp(current - 0.25, 1, 6))}
                                >
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                <span className="min-w-14 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 bg-white/10 text-white hover:bg-white/20"
                                    onClick={() => setZoom((current) => clamp(current + 0.25, 1, 6))}
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 bg-white/10 text-white hover:bg-white/20"
                                    onClick={resetDialogTransform}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div
                            ref={viewportRef}
                            className="relative flex-1 overflow-hidden bg-neutral-100"
                            onDoubleClick={resetDialogTransform}
                            onWheel={(event) => {
                                event.preventDefault()
                                setZoom((current) => clamp(current + (event.deltaY < 0 ? 0.15 : -0.15), 1, 6))
                            }}
                            onPointerDown={(event) => {
                                if (zoom <= 1) return
                                setDragging(true)
                                setDragStart({ x: event.clientX - pan.x, y: event.clientY - pan.y })
                            }}
                            onPointerMove={(event) => {
                                if (!dragging || zoom <= 1) return
                                setPan({
                                    x: event.clientX - dragStart.x,
                                    y: event.clientY - dragStart.y,
                                })
                            }}
                            onPointerUp={() => setDragging(false)}
                            onPointerLeave={() => setDragging(false)}
                            style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <img
                                    src={src}
                                    alt={alt}
                                    draggable={false}
                                    className="max-h-full max-w-full select-none object-contain will-change-transform"
                                    style={{ transform: zoomTransform }}
                                />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
