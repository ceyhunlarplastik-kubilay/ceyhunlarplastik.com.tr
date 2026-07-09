"use client"

import { motion } from "motion/react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { FileText, ImageIcon, Video } from "lucide-react"

type Props = {
    product: any
}

export default function ProductMediaRow({ product }: Props) {

    const t = useTranslations("public.productDetail.media")

    const animation = product.assets?.find((a: any) => a.role === "ANIMATION")
    const technical = product.assets?.find((a: any) => a.role === "TECHNICAL_DRAWING")
    const video = product.assets?.find((a: any) => a.type === "VIDEO")

    return (
        <div className="grid md:grid-cols-3 gap-6 mt-16">

            <MediaCard
                title={t("animationTitle")}
                icon={<ImageIcon size={18} />}
                asset={animation}
                type="image"
            />

            <MediaCard
                title={t("technicalTitle")}
                icon={<FileText size={18} />}
                asset={technical}
                type="technical"
            />

            <MediaCard
                title={t("videoTitle")}
                icon={<Video size={18} />}
                asset={video}
                type="video"
            />

        </div>
    )
}


function MediaCard({ title, icon, asset, type }: any) {

    const t = useTranslations("public.productDetail.media")

    return (

        <motion.div
            whileHover={{ y: -4 }}
            className="border rounded-xl overflow-hidden bg-white shadow-sm"
        >

            <div className="p-4 flex items-center gap-2 border-b bg-neutral-50">

                {icon}

                <span className="text-sm font-medium">
                    {title}
                </span>

            </div>


            <div className="aspect-video flex items-center justify-center">

                {!asset && (
                    <span className="text-neutral-400 text-sm">
                        {t("notFound")}
                    </span>
                )}


                {asset && type === "image" && (

                    <Dialog>
                        <DialogTrigger asChild>
                            <Image
                                src={asset.url}
                                alt={t("technicalAlt")}
                                width={600}
                                height={400}
                                className="object-contain w-full h-full cursor-zoom-in"
                            />
                        </DialogTrigger>

                        <DialogContent className="max-w-4xl">

                            <DialogHeader className="sr-only">
                                <DialogTitle>{t("technicalAlt")}</DialogTitle>
                            </DialogHeader>

                            <Image
                                src={asset.url}
                                alt={t("technicalAlt")}
                                width={1200}
                                height={900}
                                className="object-contain w-full"
                            />

                        </DialogContent>
                    </Dialog>

                )}


                {asset && type === "technical" && (
                    <>
                        {asset.mimeType === "application/pdf" ? (

                            <iframe
                                src={asset.url}
                                className="w-full h-full"
                            />

                        ) : (

                            <Dialog>

                                <DialogTrigger asChild>
                                    <Image
                                        src={asset.url}
                                        alt={t("technicalAlt")}
                                        width={600}
                                        height={400}
                                        className="object-contain w-full h-full cursor-zoom-in"
                                    />
                                </DialogTrigger>

                                <DialogContent className="max-w-4xl">

                                    <DialogHeader className="sr-only">
                                        <DialogTitle>{t("technicalAlt")}</DialogTitle>
                                    </DialogHeader>

                                    <Image
                                        src={asset.url}
                                        alt={t("technicalAlt")}
                                        width={1200}
                                        height={900}
                                        className="object-contain w-full"
                                    />

                                </DialogContent>

                            </Dialog>

                        )}
                    </>
                )}

                {asset && type === "video" && (

                    <video
                        src={asset.url}
                        controls
                        className="w-full h-full object-contain"
                    />

                )}

            </div>

        </motion.div>

    )
}