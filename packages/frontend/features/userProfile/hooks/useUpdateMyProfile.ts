"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { AdminUser } from "@/features/admin/users/api/types"
import { updateMyProfile } from "@/features/userProfile/api/updateMyProfile"

export function useUpdateMyProfile() {
    const qc = useQueryClient()

    return useMutation<AdminUser, Error, Parameters<typeof updateMyProfile>[0]>({
        mutationFn: updateMyProfile,
        onSuccess(user) {
            qc.invalidateQueries({ queryKey: ["my-access"] })
            qc.invalidateQueries({ queryKey: ["admin-users"] })
            qc.invalidateQueries({ queryKey: ["admin-user", user.id] })
            qc.invalidateQueries({ queryKey: ["protected-users"] })
        },
    })
}
