"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
    const [isCustomerAssignable, setIsCustomerAssignable] = useState(false)
    const isSystemCustomerAttribute = ["sector", "production_group", "usage_area"].includes(code.trim())

    const mutation = useMutation({
        mutationFn: async () => {
            await adminApiClient.post("/product-attributes", {
                name,
                code,
                isCustomerAssignable: isSystemCustomerAttribute ? true : isCustomerAssignable,
            })
        },
        onSuccess() {
            setName("")
            setCode("")
            setIsCustomerAssignable(false)
            onOpenChange(false)

            queryClient.invalidateQueries({
                queryKey: ["product-attributes-filter"]
            })
        }
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Yeni Özellik</DialogTitle>
                    <DialogDescription>
                        Ürün filtrelerinde ve müşteri profilinde kullanılacak yeni özellik sözlüğünü oluşturun.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="attribute-name">Özellik adı</Label>
                            <Input
                                id="attribute-name"
                                placeholder="Örn. Sektör"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="attribute-code">Kod</Label>
                            <Input
                                id="attribute-code"
                                placeholder="Örn. usage_area"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </div>
                    </div>

                    {isSystemCustomerAttribute ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <div className="text-sm font-medium text-amber-950">
                                Sistem müşteri profil alanı
                            </div>
                            <p className="mt-1 text-xs leading-5 text-amber-900/75">
                                Bu kod müşteri profilinde otomatik kullanılabilir. Checkbox ile ayrıca seçilmez.
                            </p>
                        </div>
                    ) : (
                        <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 px-4 py-3">
                            <Checkbox
                                checked={isCustomerAssignable}
                                onCheckedChange={(checked) => setIsCustomerAssignable(Boolean(checked))}
                                className="mt-0.5"
                            />
                            <span className="space-y-1">
                                <span className="block text-sm font-medium text-neutral-900">
                                    Müşteri profilinde kullanılabilir
                                </span>
                                <span className="block text-xs text-neutral-500">
                                    Bu özellik müşteri profili seçim alanlarında kullanılabilir. Ürün kategori kısıtlarını değiştirmez.
                                </span>
                            </span>
                        </label>
                    )}

                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending || !name.trim() || !code.trim()}
                        className="w-full"
                    >
                        Oluştur
                    </Button>

                </div>
            </DialogContent>
        </Dialog>
    )
}
