"use client"

import { useState } from "react"

export function useBusinessRequestTableState() {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [showAllFieldsById, setShowAllFieldsById] = useState<Record<string, boolean>>({})

    return {
        expandedId,
        showAllFieldsById,
        toggleExpanded(id: string) {
            setExpandedId((current) => current === id ? null : id)
        },
        toggleShowAllFields(id: string) {
            setShowAllFieldsById((current) => ({
                ...current,
                [id]: !current[id],
            }))
        },
    }
}
