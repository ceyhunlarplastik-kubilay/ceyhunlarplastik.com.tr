"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteUser } from "@/features/admin/users/api/deleteUser"

export function useDeleteUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteUser,
        onSuccess(_, userId) {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] })
            queryClient.removeQueries({ queryKey: ["admin-user", userId] })
        },
    })
}
