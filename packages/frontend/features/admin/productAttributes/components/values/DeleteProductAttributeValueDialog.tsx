"use client"

import { Loader2, Trash2 } from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { ProductAttributeValue } from "@/features/admin/productAttributes/types"

type Props = {
    value: ProductAttributeValue | null
    open: boolean
    isPending: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
}

export function DeleteProductAttributeValueDialog({
    value,
    open,
    isPending,
    onOpenChange,
    onConfirm,
}: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Değeri silmek istiyor musunuz?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {value ? `"${value.name}" değeri silinecek.` : "Seçili değer silinecek."} Bu değere bağlı görseller varsa backend önce S3 üzerindeki dosyaları siler. Ürün, müşteri, kategori kısıtı, alt değer veya endüstriyel kullanım bağlantısı varsa işlem engellenir.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Vazgeç</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isPending}
                        onClick={(event) => {
                            event.preventDefault()
                            onConfirm()
                        }}
                        className="bg-red-600 text-white hover:bg-red-700"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        Sil
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
