"use client"

import { useState } from "react"

export function useBusinessRequestDecisionState() {
    const [noteById, setNoteById] = useState<Record<string, string>>({})
    const [counterByRequestId, setCounterByRequestId] = useState<Record<string, Record<string, string>>>({})

    return {
        getNote(requestId: string) {
            return noteById[requestId] ?? ""
        },
        getCounterValues(requestId: string) {
            return counterByRequestId[requestId] ?? {}
        },
        setNote(requestId: string, value: string) {
            setNoteById((current) => ({
                ...current,
                [requestId]: value,
            }))
        },
        setCounterValue(requestId: string, itemId: string, value: string) {
            setCounterByRequestId((current) => ({
                ...current,
                [requestId]: {
                    ...(current[requestId] ?? {}),
                    [itemId]: value,
                },
            }))
        },
    }
}
