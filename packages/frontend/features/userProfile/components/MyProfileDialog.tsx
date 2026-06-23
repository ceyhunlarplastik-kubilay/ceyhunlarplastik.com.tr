"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import type { AdminUser } from "@/features/admin/users/api/types"
import { UserEditDialog } from "@/features/admin/users/components/UserEditDialog"
import { buildUserEditorSubmission, type UserEditorFormValues } from "@/features/admin/users/schema/userEditor"
import { useMyProfile } from "@/features/userProfile/hooks/useMyProfile"
import { useUpdateMyProfile } from "@/features/userProfile/hooks/useUpdateMyProfile"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function MyProfileDialog({ open, onOpenChange }: Props) {
    const router = useRouter()
    const myProfileQuery = useMyProfile({ enabled: open })
    const updateProfile = useUpdateMyProfile()
    const user = myProfileQuery.data?.user ?? null

    async function handleSubmit(_: AdminUser, values: UserEditorFormValues) {
        if (!user) return

        const plan = buildUserEditorSubmission(user, values)
        if (!plan.profileChanged) {
            toast.message("Güncellenecek bir alan bulunmuyor.")
            onOpenChange(false)
            return
        }

        try {
            await updateProfile.mutateAsync({
                firstName: values.firstName,
                lastName: values.lastName,
                identifier: values.identifier,
                phone: values.phone,
                customerContactTitle: user.customerId ? values.customerContactTitle : null,
                customerContactDepartment: user.customerId ? values.customerContactDepartment : null,
            })
            onOpenChange(false)
            router.refresh()
            toast.success("Profiliniz güncellendi.")
        } catch {
            toast.error("Profiliniz güncellenemedi.")
        }
    }

    if (user) {
        return (
            <UserEditDialog
                open={open}
                user={user}
                mode="self"
                isSaving={updateProfile.isPending}
                onOpenChange={onOpenChange}
                onSubmit={handleSubmit}
            />
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg rounded-[28px] border border-neutral-200">
                <DialogHeader>
                    <DialogTitle>Profilimi Düzenle</DialogTitle>
                    <DialogDescription>
                        {myProfileQuery.isError
                            ? "Profil bilgileri alınamadı."
                            : "Profil bilgileriniz yükleniyor."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-32 items-center justify-center">
                    {myProfileQuery.isError ? (
                        <p className="text-sm text-rose-600">Lütfen tekrar deneyin.</p>
                    ) : (
                        <div className="inline-flex items-center gap-2 text-sm text-neutral-500">
                            <Spinner className="size-4" />
                            Profil bilgisi yükleniyor...
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Kapat
                    </Button>
                    {myProfileQuery.isError ? (
                        <Button type="button" onClick={() => void myProfileQuery.refetch()}>
                            Tekrar Dene
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
