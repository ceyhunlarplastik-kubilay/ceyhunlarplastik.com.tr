"use client"

import { Controller, type Control } from "react-hook-form"
import { Clapperboard, Video } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
    buildYoutubeThumbnailUrl,
    extractYoutubeVideoId,
} from "@core/helpers/products/youtubeVideo"
import type { ProductFormValues } from "@/features/admin/products/schema/productFormSchema"

type VideoFieldName = "assemblyVideoUrl" | "promoVideoUrl"

type Props = {
    control: Control<ProductFormValues>
}

const VIDEO_FIELDS: Array<{
    name: VideoFieldName
    label: string
    hint: string
    icon: typeof Clapperboard
}> = [
    {
        name: "assemblyVideoUrl",
        label: "Montaj Videosu (YouTube)",
        hint: "Kurulum/montaj adımlarını anlatan video.",
        icon: Clapperboard,
    },
    {
        name: "promoVideoUrl",
        label: "Tanıtım Videosu (YouTube)",
        hint: "Ürünü genel olarak tanıtan video.",
        icon: Video,
    },
]

/**
 * Ürün videoları YouTube'da barındırılır — S3'e dosya yüklenmez, yalnızca link
 * kaydedilir. Kart hem oluşturma hem düzenleme dialog'unda kullanılır.
 */
export function ProductVideoLinksCard({ control }: Props) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4 space-y-1">
                <div className="text-sm font-semibold text-neutral-900">Ürün Videoları</div>
                <div className="text-xs text-neutral-500">
                    Videolar YouTube&apos;dan gösterilir; dosya yüklemeye gerek yok. Watch, youtu.be,
                    shorts veya embed bağlantılarının hepsi kabul edilir.
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {VIDEO_FIELDS.map(({ name, label, hint, icon: Icon }) => (
                    <Controller
                        key={name}
                        name={name}
                        control={control}
                        render={({ field, fieldState }) => {
                            const videoId = extractYoutubeVideoId(field.value)

                            return (
                                <Field>
                                    <FieldLabel className="flex items-center gap-2">
                                        <Icon className="h-3.5 w-3.5 text-neutral-500" />
                                        {label}
                                    </FieldLabel>

                                    <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        inputMode="url"
                                    />

                                    {fieldState.error ? (
                                        <FieldError errors={[fieldState.error]} />
                                    ) : (
                                        <p className="text-xs text-neutral-500">{hint}</p>
                                    )}

                                    {videoId ? (
                                        <div className="mt-1 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                                            {/* Next Image kullanılmaz: i.ytimg.com'u remotePatterns'e eklemeye gerek kalmasın. */}
                                            <img
                                                src={buildYoutubeThumbnailUrl(videoId)}
                                                alt={`${label} önizlemesi`}
                                                loading="lazy"
                                                decoding="async"
                                                className="aspect-video w-full object-cover"
                                            />
                                        </div>
                                    ) : null}
                                </Field>
                            )
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
