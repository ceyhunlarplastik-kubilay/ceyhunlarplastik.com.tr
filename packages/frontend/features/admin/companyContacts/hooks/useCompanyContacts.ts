"use client"

import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    createCompanyContact,
    listCompanyContacts,
    updateCompanyContact,
    type CompanyContactListParams,
} from "@/features/admin/companyContacts/api/companyContacts"
import type { CompanyContactInput } from "@/features/admin/companyContacts/api/types"

export function useCompanyContacts(params: CompanyContactListParams = {}) {
    const normalizedParams = useMemo(() => params, [params])

    return useQuery({
        queryKey: ["admin-company-contacts", normalizedParams],
        queryFn: () => listCompanyContacts(normalizedParams),
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}

export function useCreateCompanyContact() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (input: CompanyContactInput) => createCompanyContact(input),
        onSuccess() {
            qc.invalidateQueries({ queryKey: ["admin-company-contacts"] })
            qc.invalidateQueries({ queryKey: ["sales-managed-company-contacts"] })
        },
    })
}

export function useUpdateCompanyContact() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: ({ id, ...input }: Partial<CompanyContactInput> & { id: string }) =>
            updateCompanyContact(id, input),
        onSuccess() {
            qc.invalidateQueries({ queryKey: ["admin-company-contacts"] })
            qc.invalidateQueries({ queryKey: ["sales-managed-company-contacts"] })
            qc.invalidateQueries({ queryKey: ["admin-customers"] })
            qc.invalidateQueries({ queryKey: ["admin-customer"] })
            qc.invalidateQueries({ queryKey: ["sales-managed-customers"] })
            qc.invalidateQueries({ queryKey: ["sales-managed-customer"] })
            qc.invalidateQueries({ queryKey: ["customer-portal-profile"] })
        },
    })
}
