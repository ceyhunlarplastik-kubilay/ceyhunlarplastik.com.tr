"use client"

import { AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { AdminUser } from "@/features/admin/users/api/types"
import { getUserDisplayName } from "@/lib/users/displayName"

type Props = {
    open: boolean
    user: AdminUser | null
    isDeleting: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (user: AdminUser) => void
}

export function UserDeleteDialog({
    open,
    user,
    isDeleting,
    onOpenChange,
    onConfirm,
}: Props) {
    if (!user) return null

    const displayName = getUserDisplayName(user) || user.email

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg rounded-[28px] border border-neutral-200 p-0">
                <div className="border-b border-neutral-200 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.96))] p-6">
                    <DialogHeader>
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Geri Alinamaz Islem
                        </div>
                        <DialogTitle className="mt-3">Kullaniciyi Sil</DialogTitle>
                        <DialogDescription className="mt-1">
                            Bu islem kullanicinin Cognito hesabi ile veritabani kaydini siler.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="space-y-4 p-6">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
                        <div className="text-sm font-semibold text-neutral-950">{displayName}</div>
                        <div className="mt-1 text-sm text-neutral-500">{user.email}</div>
                        <div className="mt-1 text-xs text-neutral-400">@{user.identifier}</div>
                    </div>

                    <p className="text-sm leading-6 text-neutral-600">
                        Tarihsel iliskili kayitlari olan kullanicilar backend tarafinda korunur ve silme istegi reddedilir.
                    </p>
                </div>

                <DialogFooter className="border-t border-neutral-200 px-6 py-4 sm:justify-between">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Vazgec
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={() => onConfirm(user)}
                    >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting ? "Siliniyor..." : "Kullaniciyi Sil"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
