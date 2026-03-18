"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

import { adminApiClient } from "@/lib/http/client"
import { useQueryClient, useMutation } from "@tanstack/react-query"

export function CreateAttributeDialog({
    open,
    onOpenChange
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
}) {

    const queryClient = useQueryClient()

    const [name, setName] = useState("")
    const [code, setCode] = useState("")

    const mutation = useMutation({
        mutationFn: async () => {
            await adminApiClient.post("/product-attributes", {
                name,
                code
            })
        },
        onSuccess() {
            setName("")
            setCode("")
            onOpenChange(false)

            queryClient.invalidateQueries({
                queryKey: ["product-attributes-filter"]
            })
        }
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Attribute</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">

                    <Input
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <Input
                        placeholder="Code (örn: usage_area)"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />

                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                    >
                        Oluştur
                    </Button>

                </div>
            </DialogContent>
        </Dialog>
    )
}