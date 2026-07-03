"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateAttributeDialog } from "./CreateAttributeDialog"

type Props = {
    title?: string
    description?: string
    actionLabel?: string
}

export function AttributeHeader({
    title = "Ürün Özellikleri",
    description = "Ürün özelliklerini yönetin",
    actionLabel = "Yeni Özellik",
}: Props) {

    const [open, setOpen] = useState(false)

    return (
        <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 bg-gradient-to-br from-neutral-50 via-white to-amber-50 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                        Veri sözlüğü
                    </div>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                        {title}
                    </h1>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">
                        {description}
                    </p>
                </div>

                <Button onClick={() => setOpen(true)} className="w-fit gap-2">
                    <Plus className="h-4 w-4" />
                    {actionLabel}
                </Button>
            </div>

            <CreateAttributeDialog
                open={open}
                onOpenChange={setOpen}
            />

        </div>
    )
}
