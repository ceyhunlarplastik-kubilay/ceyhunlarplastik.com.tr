"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlowCard } from "@/components/ui/spotlight-card"
import type { Asset } from "@/features/public/assets/types"

const PdfPreview = dynamic(
    () => import("@/features/public/catalogs/components/PdfPreview").then((module) => module.PdfPreview),
    { ssr: false },
)

type Props = {
    title: string
    subtitle?: string
    certificate: Asset
}

export function MaterialCertificateCard({ title, subtitle, certificate }: Props) {
    const t = useTranslations("public.materials")
    return (
        <article className="h-full min-w-0">
            <GlowCard customSize className="group w-full min-w-0 overflow-hidden p-4 md:p-5">
                <div className="flex h-full min-w-0 flex-col gap-4">
                    <div className="relative">
                        <Link
                            href={certificate.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative mx-auto block aspect-[210/297] w-full max-w-[250px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition-transform duration-300 group-hover:scale-[1.015]"
                        >
                            <PdfPreview url={certificate.url} />
                            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
                        </Link>

                        <div className="absolute -top-2 right-2 z-10 rounded bg-red-600 px-2 py-1 text-[10px] font-bold uppercase text-white shadow-md">
                            PDF
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{title}</p>
                        {subtitle ? (
                            <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
                        ) : null}
                    </div>

                    <div className="mt-auto">
                        <Button variant="outline" className="w-full text-sm font-medium" asChild>
                            <a href={certificate.url} download>
                                <Download className="mr-2 h-4 w-4" />
                                {t("download")}
                            </a>
                        </Button>
                    </div>
                </div>
            </GlowCard>
        </article>
    )
}
