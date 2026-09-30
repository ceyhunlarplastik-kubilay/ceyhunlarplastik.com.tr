import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { ShiftPattern, ShiftPatternInput } from "@/features/production/shiftPatterns/api/types"

export async function listShiftPatterns(): Promise<ShiftPattern[]> {
    const res = await protectedApiClient.get<ApiEnvelope<{ shiftPatterns: ShiftPattern[] }>>("/production/shift-patterns")
    return res.data.payload.shiftPatterns
}

export async function createShiftPattern(input: ShiftPatternInput): Promise<ShiftPattern> {
    const res = await protectedApiClient.post<ApiEnvelope<{ shiftPattern: ShiftPattern }>>("/production/shift-patterns", input)
    return res.data.payload.shiftPattern
}

/** Tam değişim: vardiya listesi her zaman eksiksiz gönderilir. */
export async function replaceShiftPattern(id: string, input: ShiftPatternInput): Promise<ShiftPattern> {
    const res = await protectedApiClient.put<ApiEnvelope<{ shiftPattern: ShiftPattern }>>(`/production/shift-patterns/${id}`, input)
    return res.data.payload.shiftPattern
}

export async function deleteShiftPattern(id: string): Promise<void> {
    await protectedApiClient.delete(`/production/shift-patterns/${id}`)
}
