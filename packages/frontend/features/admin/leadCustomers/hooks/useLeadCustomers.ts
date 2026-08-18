"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { resolveCustomerDisplayName } from "@core/helpers/crm/customerDisplayName"
import { toast } from "sonner"

import {
    createLeadCustomer,
    createLeadCustomerAddress,
    deleteLeadCustomerAddress,
    getLeadCustomer,
    leadCustomerKeys,
    listLeadCustomers,
    updateLeadCustomer,
    updateLeadCustomerAddress,
    type LeadCustomerAddressInput,
} from "@/features/admin/leadCustomers/api/leadCustomersApi"
import type {
    LeadCustomerProfileInput,
    ListLeadCustomersParams,
} from "@/features/admin/leadCustomers/api/types"

export function useLeadCustomers(params: ListLeadCustomersParams) {
    return useQuery({
        queryKey: leadCustomerKeys.list(params),
        queryFn: () => listLeadCustomers(params),
        placeholderData: (prev) => prev,
        refetchOnWindowFocus: false,
    })
}

export function useLeadCustomer(id: string) {
    return useQuery({
        queryKey: leadCustomerKeys.detail(id),
        queryFn: () => getLeadCustomer(id),
        enabled: Boolean(id),
        refetchOnWindowFocus: false,
    })
}

export function useCreateLeadCustomer() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (body: LeadCustomerProfileInput) => createLeadCustomer(body),
        onSuccess: async (customer) => {
            await queryClient.invalidateQueries({ queryKey: leadCustomerKeys.all })
            toast.success(
                `${resolveCustomerDisplayName(customer)} kaydedildi · profiliyle eşleşen ${customer.matchedProductCount} ürün`,
            )
        },
    })
}

export function useUpdateLeadCustomer(id: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (body: LeadCustomerProfileInput) => updateLeadCustomer(id, body),
        onSuccess: async (customer) => {
            await queryClient.invalidateQueries({ queryKey: leadCustomerKeys.all })
            toast.success(
                `Profil güncellendi · eşleşen ${customer.matchedProductCount} ürün`,
            )
        },
    })
}

/**
 * Adres mutasyonları — üçü de güncel müşteri detayını döndürdüğü için cache
 * doğrudan yazılır; ekstra bir GET turu yapılmaz.
 */
export function useLeadCustomerAddressMutations(customerId: string) {
    const queryClient = useQueryClient()

    const onSettledSuccess = async (message: string) => {
        await queryClient.invalidateQueries({ queryKey: leadCustomerKeys.all })
        toast.success(message)
    }

    const create = useMutation({
        mutationFn: (body: LeadCustomerAddressInput) =>
            createLeadCustomerAddress(customerId, body),
        onSuccess: () => onSettledSuccess("Adres eklendi"),
    })

    const update = useMutation({
        mutationFn: ({ addressId, body }: { addressId: string; body: LeadCustomerAddressInput }) =>
            updateLeadCustomerAddress(customerId, addressId, body),
        onSuccess: () => onSettledSuccess("Adres güncellendi"),
    })

    const remove = useMutation({
        mutationFn: (addressId: string) => deleteLeadCustomerAddress(customerId, addressId),
        onSuccess: () => onSettledSuccess("Adres silindi"),
    })

    return { create, update, remove }
}
