import { adminApiClient } from "@/lib/http/client"
import type {
    LeadCustomerDetailResponse,
    LeadCustomerProfileInput,
    ListLeadCustomersParams,
    ListLeadCustomersResponse,
} from "./types"

export const leadCustomerKeys = {
    all: ["lead-customers"] as const,
    list: (params: ListLeadCustomersParams) => [...leadCustomerKeys.all, "list", params] as const,
    detail: (id: string) => [...leadCustomerKeys.all, "detail", id] as const,
}

export async function listLeadCustomers(params: ListLeadCustomersParams) {
    const res = await adminApiClient.get<ListLeadCustomersResponse>("/lead-customers", { params })
    return res.data.payload
}

export async function getLeadCustomer(id: string) {
    const res = await adminApiClient.get<LeadCustomerDetailResponse>(`/lead-customers/${id}`)
    return res.data.payload.customer
}

export async function createLeadCustomer(body: LeadCustomerProfileInput) {
    const res = await adminApiClient.post<LeadCustomerDetailResponse>("/lead-customers", body)
    return res.data.payload.customer
}

export async function updateLeadCustomer(id: string, body: LeadCustomerProfileInput) {
    const res = await adminApiClient.put<LeadCustomerDetailResponse>(`/lead-customers/${id}`, body)
    return res.data.payload.customer
}

export type LeadCustomerAddressInput = Record<string, unknown>

export async function createLeadCustomerAddress(
    customerId: string,
    body: LeadCustomerAddressInput,
) {
    const res = await adminApiClient.post<LeadCustomerDetailResponse>(
        `/lead-customers/${customerId}/addresses`,
        body,
    )
    return res.data.payload.customer
}

export async function updateLeadCustomerAddress(
    customerId: string,
    addressId: string,
    body: LeadCustomerAddressInput,
) {
    const res = await adminApiClient.put<LeadCustomerDetailResponse>(
        `/lead-customers/${customerId}/addresses/${addressId}`,
        body,
    )
    return res.data.payload.customer
}

export async function deleteLeadCustomerAddress(customerId: string, addressId: string) {
    const res = await adminApiClient.delete<LeadCustomerDetailResponse>(
        `/lead-customers/${customerId}/addresses/${addressId}`,
    )
    return res.data.payload.customer
}
