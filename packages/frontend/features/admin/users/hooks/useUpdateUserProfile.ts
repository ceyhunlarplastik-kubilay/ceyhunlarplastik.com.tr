"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateUserProfile } from "@/features/admin/users/api/updateUserProfile"

export function useUpdateUserProfile() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: updateUserProfile,
        onSuccess(_, variables) {
            qc.invalidateQueries({ queryKey: ["admin-users"] })
            qc.invalidateQueries({ queryKey: ["admin-user", variables.id] })
        },
    })
}
