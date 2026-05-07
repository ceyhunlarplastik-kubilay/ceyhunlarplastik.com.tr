"use client"

import { useMutation } from "@tanstack/react-query"
import { logout } from "@/features/auth/api/logout"

export function useAuthLogout() {
    return useMutation({
        mutationFn: logout,
    })
}
