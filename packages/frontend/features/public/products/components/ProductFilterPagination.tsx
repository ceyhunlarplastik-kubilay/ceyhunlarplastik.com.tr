"use client"

import { useTransition } from "react"
import { motion } from "motion/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import { useFilterStore } from "@/features/public/products/store/filterStore"
import { useRouter } from "next/navigation"

type Props = {
    page: number
    totalPages: number
}

export default function ProductFilterPagination({ page, totalPages }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const { setPage, toQueryString } = useFilterStore()

    if (totalPages <= 1) return null

    function go(pageNum: number) {
        setPage(pageNum)

        startTransition(() => {
            router.replace(`/urunler/filtre?${toQueryString()}`)
        })
    }

    return (
        <div className="flex justify-center gap-2 mt-8">

            <Button onClick={() => go(page - 1)} disabled={page <= 1}>
                <ChevronLeft />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <motion.div key={p} whileTap={{ scale: 0.9 }}>
                    <Button
                        onClick={() => go(p)}
                        variant={p === page ? "default" : "outline"}
                    >
                        {p}
                    </Button>
                </motion.div>
            ))}

            <Button onClick={() => go(page + 1)} disabled={page >= totalPages}>
                <ChevronRight />
            </Button>
        </div>
    )
}