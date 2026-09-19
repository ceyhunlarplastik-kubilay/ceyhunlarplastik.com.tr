"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { inviteManagedCustomer } from "@/features/sales/customers/api/inviteManagedCustomer"
import type { CustomerPortalUserInviteFormValues } from "@/features/customerPortal/schema/customerPortalUserInvite"
import { managedLeadCustomerDetailKeys } from "@/features/sales/leadCustomers/hooks/useManagedLeadCustomer"

export function useInviteManagedCustomer(customerId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: CustomerPortalUserInviteFormValues) => inviteManagedCustomer(customerId, input),
        onSuccess: async () => {
            toast.success("Portal daveti gönderildi.")
            // Davet KABUL edildiğinde (bu istekte değil) LEAD otomatik CUSTOMER'a
            // dönüşür — o an bu detay sorgusu zaten farklı bir oturumda tazelenir;
            // burada yalnız görüntülenen kaydı güncel tutmak için invalidate ediyoruz.
            await queryClient.invalidateQueries({ queryKey: managedLeadCustomerDetailKeys.detail(customerId) })
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Portal daveti gönderilirken bir hata oluştu."
            toast.error(message)
        },
    })
}
