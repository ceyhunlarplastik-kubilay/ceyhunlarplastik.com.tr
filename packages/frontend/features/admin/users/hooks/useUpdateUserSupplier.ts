"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateUserSupplier } from "@/features/admin/users/api/updateUserSupplier"

export function useUpdateUserSupplier() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: updateUserSupplier,
        onSuccess() {
            qc.invalidateQueries({ queryKey: ["admin-users"] })
        },
    })
}
