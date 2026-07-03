"use client"

import { ImageOff, Loader2 } from "lucide-react"

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

type Asset = NonNullable<ProductAttributeValue["assets"]>[number]

type Props = {
    target: { value: ProductAttributeValue; asset: Asset } | null
    open: boolean
    isPending: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
}

export function DeleteAssetDialog({
    target,
    open,
    isPending,
    onOpenChange,
    onConfirm,
}: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Görseli silmek istiyor musunuz?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {target ? `"${target.value.name}" değerine bağlı görsel silinecek.` : "Seçili görsel silinecek."} Bu işlem hem asset kaydını hem de S3 üzerindeki dosyayı backend üzerinden kaldırır.
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
                            <ImageOff className="h-4 w-4" />
                        )}
                        Görseli Sil
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
