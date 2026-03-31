"use client"

import { GlowCard } from "@/components/ui/spotlight-card"
// import { PdfPreview } from "./PdfPreview"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

const PdfPreview = dynamic(
    () => import("./PdfPreview").then(m => m.PdfPreview),
    { ssr: false } // 🔥 kritik
)

export function CatalogCard({ category }: { category: any }) {
    const catalog = category.assets?.find(
        (a: any) => a.type === "PDF" && a.role === "DOCUMENT"
    )

    if (!catalog) return null

    return (
        <article className="h-full min-w-0">
            <GlowCard
                customSize
                className="group w-full min-w-0 overflow-hidden p-4 md:p-5"
            >
                <div className="h-full min-w-0 flex flex-col gap-4">
                    {/* PREVIEW CONTAINER */}
                    <div className="relative">
                        <Link
                            href={catalog.url}
                            target="_blank"
                            className="relative block w-full max-w-[250px] mx-auto aspect-[210/297] bg-white overflow-hidden border border-neutral-200 rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-[1.015]"
                        >
                            <PdfPreview url={catalog.url} />

                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                        </Link>

                        <div className="absolute -top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-10 uppercase">
                            PDF
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-semibold text-neutral-900 line-clamp-2">
                            {category.name}
                        </p>
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-auto">
                        <Button
                            variant="outline"
                            className="w-full text-sm font-medium"
                            asChild
                        >
                            <a href={catalog.url} download>
                                <Download className="w-4 h-4 mr-2" />
                                İndir
                            </a>
                        </Button>
                    </div>
                </div>
            </GlowCard>
        </article>
    )
}
