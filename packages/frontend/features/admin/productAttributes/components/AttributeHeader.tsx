"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreateAttributeDialog } from "./CreateAttributeDialog"

export function AttributeHeader() {

    const [open, setOpen] = useState(false)

    return (
        <div className="flex justify-between items-center">

            <div>
                <h1 className="text-2xl font-bold">
                    Ürün Özellikleri
                </h1>
                <p className="text-sm text-neutral-500">
                    Ürün özelliklerini yönetin
                </p>
            </div>

            <Button onClick={() => setOpen(true)}>
                Yeni Attribute
            </Button>

            <CreateAttributeDialog
                open={open}
                onOpenChange={setOpen}
            />

        </div>
    )
}