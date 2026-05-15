"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateUserRole } from "@/features/admin/users/api/updateUserRole"

export function useUpdateUserRole() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: updateUserRole,
        onSuccess() {
            qc.invalidateQueries({ queryKey: ["admin-users"] })
        },
    })
}
