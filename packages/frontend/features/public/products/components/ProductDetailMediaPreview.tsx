"use client"

import Image from "next/image"
import { Play, Maximize2, ArrowUpRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import ProductYoutubeEmbed from "@/features/public/products/components/ProductYoutubeEmbed"
import { buildYoutubeThumbnailUrl, extractYoutubeVideoId } from "@core/helpers/products/youtubeVideo"

type Props = {
    productName: string
    imageUrl?: string
    videoUrl?: string
    /** Compact stacked preview: full-width thumbnail on top, thin video label below. */
    mediaOnly?: boolean
}

/** Only the media dialogs hydrate; the public overview remains server rendered. */
export default function ProductDetailMediaPreview({ productName, imageUrl, videoUrl, mediaOnly = false }: Props) {
    const t = useTranslations("public.productDetail")
    const videoId = extractYoutubeVideoId(videoUrl)
    const title = videoId ? t("assets.assemblyVideo.title") : t("imageDialogTitle")

    if (videoUrl && !videoId) return null
    if (!videoId && !imageUrl) {
        return (
            <div className="flex h-72 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground md:h-96">
                {t("imageNotFound")}
            </div>
        )
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                {videoId && mediaOnly ? (
                    <button
                        type="button"
                        className="group flex h-full w-full min-w-0 flex-col items-stretch overflow-hidden rounded-lg border border-border bg-muted/30 text-start outline-none transition-colors hover:border-brand hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.98]"
                        aria-label={t("assets.assemblyVideo.open")}
                    >
                        <span className="relative block aspect-video w-full shrink-0 overflow-hidden bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element -- same YouTube facade source as ProductYoutubeEmbed */}
                            <img src={buildYoutubeThumbnailUrl(videoId)} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
                            <span className="absolute inset-0 flex items-center justify-center bg-neutral-950/20 transition-colors group-hover:bg-neutral-950/30">
                                <span className="flex size-10 items-center justify-center rounded-full bg-brand text-white transition-colors group-hover:text-neutral-950 motion-safe:group-hover:scale-105">
                                    <Play className="size-4 fill-current" aria-hidden="true" />
                                </span>
                            </span>
                        </span>
                        {/* İnce alt bant — "az alan kaplamalı" (kullanıcı talebiyle): video artık
                            tam genişlik, etiket yalnız tek satırlık bir altbilgi. */}
                        <span className="flex min-w-0 items-center justify-between gap-2 px-3 py-2">
                            <span className="truncate text-xs font-medium leading-snug text-foreground">{title}</span>
                            <ArrowUpRight className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
                        </span>
                    </button>
                ) : videoId ? (
                    <button type="button" className="group flex h-16 min-w-56 flex-1 items-center gap-3 overflow-hidden rounded-lg border border-brand/40 bg-brand/10 pe-3 text-start outline-none transition-colors hover:border-brand hover:bg-brand/15 focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.98]" aria-label={t("assets.assemblyVideo.open")}>
                        <span className="relative block h-full w-28 shrink-0 overflow-hidden bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element -- same YouTube facade source as ProductYoutubeEmbed */}
                            <img src={buildYoutubeThumbnailUrl(videoId)} alt="" className="size-full object-cover" loading="lazy" />
                            <span className="absolute inset-0 flex items-center justify-center bg-neutral-950/20">
                                <span className="flex size-8 items-center justify-center rounded-full bg-brand text-white transition-colors group-hover:text-neutral-950 motion-safe:group-hover:scale-105">
                                    <Play className="size-3.5 fill-current" aria-hidden="true" />
                                </span>
                            </span>
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-sm font-semibold text-foreground">{title}</span>
                            <span className="text-xs text-muted-foreground">{t("assets.videoPlay")}</span>
                        </span>
                        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </button>
                ) : (
                    <button type="button" aria-label={t("imageDialogTitle")} className="group relative aspect-4/3 w-full cursor-zoom-in overflow-hidden rounded-xl border border-border bg-white outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Image src={imageUrl!} alt={productName} fill priority sizes="(min-width: 1536px) 560px, (min-width: 768px) 43vw, 100vw" className="object-contain p-4" />
                        <span className="absolute inset-e-3 bottom-3 flex size-8 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-muted-foreground">
                            <Maximize2 className="size-4" aria-hidden="true" />
                        </span>
                    </button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-4xl" aria-describedby={undefined}>
                <DialogTitle>{title}</DialogTitle>
                {videoId && videoUrl ? (
                    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
                        <ProductYoutubeEmbed url={videoUrl} title={`${productName} - ${title}`} playLabel={t("assets.videoPlay")} minHeightPx={0} initiallyActivated />
                    </AspectRatio>
                ) : (
                    <div className="relative h-[70dvh] overflow-hidden rounded-lg bg-white">
                        <Image src={imageUrl!} alt={productName} fill sizes="(min-width: 1024px) 860px, 95vw" className="object-contain" />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
