"use client"

import {
    Component,
    Suspense,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ErrorInfo,
    type ReactNode,
} from "react"
import { Canvas } from "@react-three/fiber"
import { useProgress } from "@react-three/drei"
import { AlertTriangle, Box, Maximize2, MousePointer2, Pause, Play, RotateCcw } from "lucide-react"
import { useReducedMotion } from "motion/react"
import type { Vector3 } from "three"

import type { ProductModel3dConfig } from "@core/helpers/products/model3dConfig"
import ProductR3FScene from "@/features/public/products/components/ProductR3FScene"

type Props = {
    src: string
    config: ProductModel3dConfig
    measurements: Readonly<Record<string, number | undefined>>
    colorHex?: string
    materialCodes?: string[]
    alt: string
    loadingLabel: string
    errorTitle: string
    errorDescription: string
    interactionHint: string
    resetViewLabel: string
    fullscreenLabel: string
}

type ErrorBoundaryProps = {
    resetKey: string
    onError: () => void
    children: ReactNode
}

type ErrorBoundaryState = { hasError: boolean }

class R3FErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("Parametrik 3D model yüklenemedi", error, info)
        this.props.onError()
    }

    componentDidUpdate(previousProps: ErrorBoundaryProps) {
        if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState({ hasError: false })
        }
    }

    render() {
        return this.state.hasError ? null : this.props.children
    }
}

function LoadingProgress({ label }: { label: string }) {
    const { progress } = useProgress()
    const roundedProgress = Math.round(progress)

    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-100 px-6 text-center" role="status" aria-live="polite">
            <div className="flex size-44 items-center justify-center rounded-2xl bg-neutral-200/80">
                <Box className="size-12 animate-pulse text-neutral-400 motion-reduce:animate-none" aria-hidden="true" />
            </div>
            <p className="mt-5 text-sm font-medium text-neutral-700">{label}</p>
            <div className="mt-3 h-1.5 w-44 overflow-hidden rounded-full bg-neutral-200">
                <div
                    className="h-full origin-left rounded-full bg-brand transition-transform duration-300 motion-reduce:transition-none"
                    style={{ transform: `scaleX(${roundedProgress / 100})` }}
                />
            </div>
            <span className="mt-2 text-xs tabular-nums text-neutral-500">%{roundedProgress}</span>
        </div>
    )
}

export default function ProductR3FModelViewer({
    src,
    config,
    measurements,
    colorHex,
    materialCodes = [],
    alt,
    loadingLabel,
    errorTitle,
    errorDescription,
    interactionHint,
    resetViewLabel,
    fullscreenLabel,
}: Props) {
    const fullscreenRef = useRef<HTMLDivElement>(null)
    const reduceMotion = Boolean(useReducedMotion())
    const [shouldRender, setShouldRender] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [resetToken, setResetToken] = useState(0)
    const [dimensions, setDimensions] = useState<Vector3 | null>(null)
    const [animationNames, setAnimationNames] = useState<string[]>([])
    const [animationName, setAnimationName] = useState<string | null>(null)
    const [animationPlaying, setAnimationPlaying] = useState(false)

    useEffect(() => {
        const element = fullscreenRef.current
        if (!element || typeof IntersectionObserver === "undefined") {
            setShouldRender(true)
            return
        }

        const observer = new IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return
            setShouldRender(true)
            observer.disconnect()
        }, { rootMargin: "600px 0px" })

        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const handleReady = useCallback((names: string[]) => {
        setAnimationNames(names)
        setAnimationName((current) => current && names.includes(current) ? current : names[0] ?? null)
        setIsLoaded(true)
    }, [])

    const handleDimensionsChange = useCallback((nextDimensions: Vector3) => {
        setDimensions(nextDimensions.clone())
    }, [])

    const enterFullscreen = useCallback(async () => {
        try {
            await fullscreenRef.current?.requestFullscreen?.()
        } catch {
            // Tarayıcı tam ekran isteğini reddederse normal görünüm korunur.
        }
    }, [])

    const resetView = useCallback(() => setResetToken((current) => current + 1), [])

    return (
        <div
            ref={fullscreenRef}
            className="grid min-h-[430px] grid-rows-[1fr_auto] bg-neutral-100"
            aria-label={alt}
            aria-busy={!isLoaded && !hasError}
        >
            <div className="relative min-h-0 overflow-hidden">
                {shouldRender && !hasError ? (
                    <R3FErrorBoundary resetKey={src} onError={() => setHasError(true)}>
                        <Canvas
                            dpr={[1, 1.75]}
                            frameloop={animationPlaying ? "always" : "demand"}
                            camera={{ position: [2.8, 2.1, 3.2], fov: 42, near: 0.01, far: 1000 }}
                            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                            shadows
                            className="h-full min-h-[430px] w-full bg-neutral-100"
                            onCreated={({ gl }) => {
                                gl.domElement.setAttribute("aria-label", alt)
                                gl.domElement.addEventListener("webglcontextlost", () => setHasError(true), { once: true })
                            }}
                        >
                            <Suspense fallback={null}>
                                <ProductR3FScene
                                    src={src}
                                    config={config}
                                    measurements={measurements}
                                    colorHex={colorHex}
                                    materialCodes={materialCodes}
                                    animationName={animationName}
                                    animationPlaying={animationPlaying}
                                    resetToken={resetToken}
                                    reduceMotion={reduceMotion}
                                    onReady={handleReady}
                                    onDimensionsChange={handleDimensionsChange}
                                />
                            </Suspense>
                        </Canvas>
                    </R3FErrorBoundary>
                ) : null}

                {!isLoaded && !hasError ? <LoadingProgress label={loadingLabel} /> : null}

                {hasError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 px-8 text-center" role="alert">
                        <span className="inline-flex size-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700">
                            <AlertTriangle className="size-5" aria-hidden="true" />
                        </span>
                        <p className="mt-4 text-sm font-semibold text-neutral-900">{errorTitle}</p>
                        <p className="mt-1 max-w-sm text-xs leading-5 text-neutral-600">{errorDescription}</p>
                    </div>
                ) : null}

                {!hasError ? (
                    <div className="absolute end-3 top-3 z-30 flex gap-2">
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
            </div>

            <div className="flex min-h-12 flex-wrap items-center gap-3 border-t border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-600">
                <span className="inline-flex items-center gap-2">
                    <MousePointer2 className="size-4 shrink-0 text-neutral-500" aria-hidden="true" />
                    {interactionHint}
                </span>

                {dimensions ? (
                    <span className="ms-auto font-mono tabular-nums text-neutral-500">
                        X {(dimensions.x * 1000).toFixed(1)} × Y {(dimensions.y * 1000).toFixed(1)} × Z {(dimensions.z * 1000).toFixed(1)} mm
                    </span>
                ) : null}

                {animationNames.length > 0 ? (
                    <div className="flex items-center gap-2">
                        <select
                            value={animationName ?? ""}
                            onChange={(event) => {
                                setAnimationName(event.target.value)
                                setAnimationPlaying(false)
                            }}
                            className="h-8 max-w-40 rounded-lg border border-neutral-200 bg-white px-2 text-xs text-neutral-700"
                            aria-label={animationName ?? animationNames[0]}
                        >
                            {animationNames.map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
                        <button
                            type="button"
                            onClick={() => setAnimationPlaying((current) => !current)}
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                            aria-label={animationName ?? undefined}
                        >
                            {animationPlaying
                                ? <Pause className="size-3.5" aria-hidden="true" />
                                : <Play className="size-3.5" aria-hidden="true" />}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
