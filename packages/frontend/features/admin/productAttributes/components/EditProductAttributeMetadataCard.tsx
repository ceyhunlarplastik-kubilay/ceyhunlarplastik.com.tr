"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminApiClient } from "@/lib/http/client"
import type { ProductAttribute } from "@/features/admin/productAttributes/types"

type Props = {
    attribute: ProductAttribute
}

const SYSTEM_CUSTOMER_ATTRIBUTE_CODES = new Set(["sector", "production_group", "usage_area"])

export function EditProductAttributeMetadataCard({ attribute }: Props) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [name, setName] = useState(attribute.name)
    const [code, setCode] = useState(attribute.code)
    const [displayOrder, setDisplayOrder] = useState(attribute.displayOrder)
    const [isCustomerAssignable, setIsCustomerAssignable] = useState(Boolean(attribute.isCustomerAssignable))
    const isSystemCustomerAttribute = SYSTEM_CUSTOMER_ATTRIBUTE_CODES.has(code)

    const mutation = useMutation({
        mutationFn: async () => {
            await adminApiClient.put(`/product-attributes/${attribute.id}`, {
                name,
                code,
                displayOrder,
                isCustomerAssignable,
            })
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["product-attributes-filter"] }),
                queryClient.invalidateQueries({ queryKey: ["attribute-values", attribute.id] }),
            ])
            router.refresh()
        },
    })

    return (
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-5 space-y-1">
                <h2 className="text-lg font-semibold text-neutral-900">Attribute Ayarları</h2>
                <p className="text-sm text-neutral-500">
                    Bu attribute’un temel metadatasını ve müşteri profilinde kullanılabilir olup olmadığını yönetin.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="attribute-name">Attribute adı</Label>
                    <Input
                        id="attribute-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Örn. Sektör"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="attribute-code">Code</Label>
                    <Input
                        id="attribute-code"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        placeholder="Örn. usage_area"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="attribute-display-order">Sıralama</Label>
                    <Input
                        id="attribute-display-order"
                        type="number"
                        value={displayOrder}
                        onChange={(event) => setDisplayOrder(Number(event.target.value || 0))}
                    />
                </div>
                {isSystemCustomerAttribute ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 md:col-span-2">
                        <div className="text-sm font-medium text-amber-950">
                            Sistem müşteri profil alanı
                        </div>
                        <p className="mt-1 text-xs leading-5 text-amber-900/75">
                            Bu attribute müşteri profilinde otomatik kullanılabilir. Checkbox ile kapatılamaz ve ürün kategori kısıtlarını değiştirmez.
                        </p>
                    </div>
                ) : (
                    <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 px-4 py-3 md:col-span-2">
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
                                Bu attribute müşteri profili seçim alanlarında kullanılabilir. Ürün kategori kısıtlarını değiştirmez.
                            </span>
                        </span>
                    </label>
                )}
            </div>

            <div className="mt-5 flex justify-end">
                <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                    {mutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Kaydet
                </Button>
            </div>
        </div>
    )
}
