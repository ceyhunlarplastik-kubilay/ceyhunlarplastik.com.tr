import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { RosterCellInput, RosterCopyInput, RosterDay } from "@/features/production/roster/api/types"

export async function getShiftRoster(date: string): Promise<RosterDay> {
    const res = await protectedApiClient.get<ApiEnvelope<RosterDay>>("/production/shift-assignments", { params: { date } })
    return res.data.payload
}

/** Hücrenin ekibini TAM değiştirir; boş liste hücreyi boşaltır. */
export async function replaceShiftCell(input: RosterCellInput): Promise<void> {
    await protectedApiClient.put("/production/shift-assignments", input)
}

export async function copyShiftRoster(input: RosterCopyInput): Promise<{ days: number; created: number }> {
    const res = await protectedApiClient.post<ApiEnvelope<{ days: number; created: number }>>("/production/shift-assignments/copy", input)
    return res.data.payload
}
