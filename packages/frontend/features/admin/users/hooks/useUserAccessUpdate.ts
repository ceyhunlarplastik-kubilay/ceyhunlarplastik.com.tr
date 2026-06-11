"use client"

import type { AdminUser } from "@/features/admin/users/api/types"
import { buildUserEditorSubmission, type UserEditorFormValues } from "@/features/admin/users/schema/userEditor"
import { type UserAccessDraft, buildUserUpdatePayload } from "@/features/admin/users/lib/userDrafts"
import { useUpdateUserProfile } from "@/features/admin/users/hooks/useUpdateUserProfile"
import { useUpdateUserRole } from "@/features/admin/users/hooks/useUpdateUserRole"
import { useUpdateUserSupplier } from "@/features/admin/users/hooks/useUpdateUserSupplier"

export function useUserAccessUpdate() {
    const updateUserProfile = useUpdateUserProfile()
    const updateUserRole = useUpdateUserRole()
    const updateUserSupplier = useUpdateUserSupplier()

    return {
        async saveDraft(user: AdminUser, draft: UserAccessDraft | undefined) {
            const payload = buildUserUpdatePayload(user, draft)

            if (payload.roleChanged) {
                await updateUserRole.mutateAsync({
                    id: user.id,
                    group: payload.group,
                    accessStatus: payload.accessStatus,
                    supplierId: payload.supplierId,
                    customerId: payload.customerId,
                    reason: null,
                })
            }

            if (payload.assignmentsChanged) {
                await updateUserSupplier.mutateAsync({
                    id: user.id,
                    supplierId: payload.supplierId,
                    customerId: payload.customerId,
                    assignedSupplierIds: payload.assignedSupplierIds,
                    assignedCustomerIds: payload.assignedCustomerIds,
                })
            }

            return payload
        },
        async saveEditor(user: AdminUser, values: UserEditorFormValues) {
            const payload = buildUserEditorSubmission(user, values)

            if (payload.roleChanged) {
                await updateUserRole.mutateAsync(payload.rolePayload)
            }

            if (payload.assignmentsChanged) {
                await updateUserSupplier.mutateAsync(payload.assignmentPayload)
            }

            if (payload.profileChanged) {
                await updateUserProfile.mutateAsync(payload.profilePayload)
            }

            return payload
        },
    }
}
