"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import type { ModelViewerElement } from "@google/model-viewer"
import { AlertTriangle, Maximize2, MousePointer2, RotateCcw } from "lucide-react"
import { useReducedMotion } from "motion/react"

type Props = {
    src: string
    alt: string
    loadingLabel: string
    errorTitle: string
    errorDescription: string
    interactionHint: string
    resetViewLabel: string
    fullscreenLabel: string
}

type ModelViewerProgressEvent = CustomEvent<{
    totalProgress: number
}>

type ModelViewerStyle = CSSProperties & {
    "--progress-bar-height": string
}

export default function Product3DModelViewer({
    src,
    alt,
    loadingLabel,
    errorTitle,
    errorDescription,
    interactionHint,
    resetViewLabel,
    fullscreenLabel,
}: Props) {
    const viewerRef = useRef<ModelViewerElement>(null)
    const fullscreenRef = useRef<HTMLDivElement>(null)
    const reduceMotion = useReducedMotion()
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        let isActive = true
        const container = fullscreenRef.current

        const loadViewerLibrary = () => {
            import("@google/model-viewer").catch(() => {
                if (isActive) setHasError(true)
            })
        }

        if (!container || typeof IntersectionObserver === "undefined") {
            loadViewerLibrary()
            return () => {
                isActive = false
            }
        }

        const observer = new IntersectionObserver((entries) => {
            if (!entries.some(entry => entry.isIntersecting)) return
            observer.disconnect()
            loadViewerLibrary()
        }, { rootMargin: "600px 0px" })

        observer.observe(container)

        return () => {
            isActive = false
            observer.disconnect()
        }
    }, [])

    useEffect(() => {
        const viewer = viewerRef.current
        if (!viewer) return

        setIsLoaded(false)
        setHasError(false)
        setProgress(0)

        const handleLoad = () => {
            setProgress(100)
            setIsLoaded(true)
        }
        const handleError = () => {
            setHasError(true)
            setIsLoaded(false)
        }
        const handleProgress = (event: Event) => {
            const value = (event as ModelViewerProgressEvent).detail?.totalProgress ?? 0
            setProgress(Math.round(value * 100))
        }

        viewer.addEventListener("load", handleLoad)
        viewer.addEventListener("error", handleError)
        viewer.addEventListener("progress", handleProgress)

        return () => {
            viewer.removeEventListener("load", handleLoad)
            viewer.removeEventListener("error", handleError)
            viewer.removeEventListener("progress", handleProgress)
        }
    }, [src])

    const resetView = useCallback(() => {
        const viewer = viewerRef.current
        if (!viewer) return

        viewer.cameraOrbit = "auto auto auto"
        viewer.cameraTarget = "auto auto auto"
        viewer.fieldOfView = "auto"
        viewer.resetTurntableRotation()
        viewer.jumpCameraToGoal()
    }, [])

    const enterFullscreen = useCallback(async () => {
        if (!fullscreenRef.current?.requestFullscreen) return

        try {
            await fullscreenRef.current.requestFullscreen()
        } catch {
            // Tarayıcı isteği reddederse görüntüleyici normal akışta kalır.
        }
    }, [])

    const viewerStyle: ModelViewerStyle = {
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
        "--progress-bar-height": "0px",
    }

    return (
        <div
            ref={fullscreenRef}
            className="grid min-h-90 grid-rows-[1fr_auto] bg-neutral-100 sm:min-h-107.5"
            aria-busy={!isLoaded && !hasError}
        >
            <div className="relative min-h-0 overflow-hidden">
                <model-viewer
                    ref={viewerRef}
                    src={src}
                    alt={alt}
                    loading="lazy"
                    reveal="auto"
                    camera-controls
                    {...(!reduceMotion ? { "auto-rotate": true } : {})}
                    auto-rotate-delay="1800"
                    rotation-per-second="18deg"
                    touch-action="pan-y"
                    interaction-prompt={reduceMotion ? "none" : "auto"}
                    environment-image="neutral"
                    tone-mapping="neutral"
                    shadow-intensity="0.9"
                    shadow-softness="0.75"
                    exposure="1"
                    className="block h-full min-h-90 w-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand sm:min-h-107.5"
                    style={viewerStyle}
                />

                {!hasError ? (
                    <div className="absolute inset-e-3 top-3 flex gap-2">
                        <button
                            type="button"
                            onClick={resetView}
                            disabled={!isLoaded}
                            title={resetViewLabel}
                            aria-label={resetViewLabel}
                            className="inline-flex size-10 items-center justify-center rounded-xl border border-neutral-200 bg-white/95 text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            <RotateCcw className="size-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={enterFullscreen}
                            disabled={!isLoaded}
                            title={fullscreenLabel}
                            aria-label={fullscreenLabel}
                            className="inline-flex size-10 items-center justify-center rounded-xl border border-neutral-200 bg-white/95 text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            <Maximize2 className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                ) : null}

                {!isLoaded && !hasError ? (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 px-6 text-center"
                        role="status"
                        aria-live="polite"
                    >
                        <div className="h-44 w-44 animate-pulse rounded-2xl bg-neutral-200/80 motion-reduce:animate-none" />
                        <p className="mt-5 text-sm font-medium text-neutral-700">{loadingLabel}</p>
                        <div className="mt-3 h-1.5 w-44 overflow-hidden rounded-full bg-neutral-200">
                            <div
                                className="h-full rounded-full bg-brand transition-transform duration-300 motion-reduce:transition-none"
                                style={{ transform: `translateX(-${100 - progress}%)` }}
                            />
                        </div>
                        <span className="mt-2 text-xs tabular-nums text-neutral-500">%{progress}</span>
                    </div>
                ) : null}

                {hasError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 px-8 text-center" role="alert">
                        <span className="inline-flex size-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700">
                            <AlertTriangle className="size-5" aria-hidden="true" />
                        </span>
                        <p className="mt-4 text-sm font-semibold text-neutral-900">{errorTitle}</p>
                        <p className="mt-1 max-w-sm text-xs leading-5 text-neutral-600">{errorDescription}</p>
                    </div>
                ) : null}
            </div>

            <div className="flex items-center gap-2 border-t border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-600">
                <MousePointer2 className="size-4 shrink-0 text-neutral-500" aria-hidden="true" />
                <span>{interactionHint}</span>
            </div>
        </div>
    )
}
