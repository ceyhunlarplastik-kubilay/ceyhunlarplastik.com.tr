import type { ModelViewerElement } from "@google/model-viewer"
import type * as React from "react"

type ModelViewerProps = React.DetailedHTMLProps<
    React.HTMLAttributes<ModelViewerElement>,
    ModelViewerElement
> & {
    src?: string
    alt?: string
    loading?: "auto" | "lazy" | "eager"
    reveal?: "auto" | "manual"
    exposure?: number | string
    "auto-rotate"?: boolean
    "auto-rotate-delay"?: number | string
    "camera-controls"?: boolean
    "environment-image"?: string
    "interaction-prompt"?: "auto" | "none"
    "rotation-per-second"?: string
    "shadow-intensity"?: number | string
    "shadow-softness"?: number | string
    "tone-mapping"?: "auto" | "aces" | "agx" | "commerce" | "neutral" | "reinhard" | "cineon" | "linear" | "none"
    "touch-action"?: "pan-y" | "pan-x" | "none"
}

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "model-viewer": ModelViewerProps
        }
    }
}
