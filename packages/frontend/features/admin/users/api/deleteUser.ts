"use client"

import { adminApiClient } from "@/lib/http/client"

type DeleteUserResponse = {
    statusCode: number
    payload: {
        deletedUserId: string
    }
}

export async function deleteUser(id: string) {
    const res = await adminApiClient.delete<DeleteUserResponse>(`/users/${id}`)
    return res.data.payload
}
