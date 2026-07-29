"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
    buildYoutubeEmbedUrl,
    buildYoutubeThumbnailUrl,
    extractYoutubeVideoId,
} from "@core/helpers/products/youtubeVideo"

type Props = {
    url: string
    /** iframe title'ı ve kapak görselinin alt metni için kullanılır. */
    title: string
    playLabel: string
    minHeightPx?: number
}

/**
 * YouTube "facade" player: ilk render'da yalnızca kapak görseli + oynat butonu
 * basılır, iframe ancak kullanıcı tıklayınca mount edilir.
 *
 * NEDEN: gömülü YouTube iframe'i ~1MB player JS + birden çok üçüncü taraf isteği
 * indiriyor ve sayfada video olması ilk yükü ölçülebilir biçimde ağırlaştırıyor.
 * Kapak görseli düz <img> ile basılır (Next Image optimizer'a sokulmaz) — böylece
 * next.config.ts remotePatterns listesine i.ytimg.com eklemek gerekmez.
 */
export default function ProductYoutubeEmbed({
    url,
    title,
    playLabel,
    minHeightPx,
}: Props) {
    const [isActivated, setIsActivated] = useState(false)
    const prefersReducedMotion = useReducedMotion()
    const videoId = extractYoutubeVideoId(url)

    if (!videoId) return null

    const minHeight = minHeightPx ?? 280

    return (
        <div
            className="relative h-full w-full overflow-hidden bg-black"
            style={{ minHeight }}
        >
            <AnimatePresence initial={false} mode="wait">
                {isActivated ? (
                    <motion.iframe
                        key="player"
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                        src={buildYoutubeEmbedUrl(videoId, { autoplay: true })}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full border-0"
                    />
                ) : (
                    <motion.button
                        key="facade"
                        type="button"
                        onClick={() => setIsActivated(true)}
                        aria-label={playLabel}
                        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                        className="group absolute inset-0 h-full w-full cursor-pointer"
                    >
                        <img
                            src={buildYoutubeThumbnailUrl(videoId)}
                            alt={title}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                        />

                        <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />

                        <span className="absolute inset-0 flex items-center justify-center">
                            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform group-hover:scale-105 group-focus-visible:scale-105">
                                <Play className="ml-0.5 h-7 w-7 fill-neutral-900 text-neutral-900" />
                            </span>
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    )
}
