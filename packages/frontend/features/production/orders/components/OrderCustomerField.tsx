"use client"

import { useEffect, useMemo, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"

import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { OptionalFieldHint } from "@/features/admin/shared/components/DialogFormSection"
import type { ProductionOrderFormInput, ProductionOrderFormValues } from "@/features/production/orders/schema/productionOrderForm"
import { useReferenceCustomers } from "@/features/production/references/hooks/useProductionReferences"

const SEARCH_DELAY_MS = 250

/** Müşteri seçimi — sunucuda aranır (yalnız gerçek müşteriler, id + ad). */
export function OrderCustomerField({ required }: { required: boolean }) {
    const form = useFormContext<ProductionOrderFormInput, unknown, ProductionOrderFormValues>()
    const customerName = useWatch({ control: form.control, name: "customerName" })
    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DELAY_MS)
        return () => window.clearTimeout(timer)
    }, [search])

    const customersQuery = useReferenceCustomers(debouncedSearch)
    const options = useMemo(
        () => (customersQuery.data ?? []).map((customer) => ({ value: customer.id, label: customer.name })),
        [customersQuery.data],
    )

    return (
        <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>
                        Müşteri
                        {required ? " *" : <OptionalFieldHint />}
                    </FormLabel>
                    <SearchableSelect
                        value={field.value || null}
                        selectedLabel={customerName || undefined}
                        onValueChange={(value) => {
                            field.onChange(value ?? "")
                            form.setValue("customerName", options.find((entry) => entry.value === value)?.label ?? "")
                        }}
                        onSearchChange={setSearch}
                        options={options}
                        loading={customersQuery.isFetching}
                        placeholder="Müşteri seçin"
                        searchPlaceholder="Firma ya da kişi adı ara"
                        emptyText={customersQuery.isFetching ? "Aranıyor…" : "Müşteri bulunamadı"}
                        aria-label="Müşteri"
                    />
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}
