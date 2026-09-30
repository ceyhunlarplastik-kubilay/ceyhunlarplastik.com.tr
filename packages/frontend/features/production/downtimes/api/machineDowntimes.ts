import { protectedApiClient } from "@/lib/http/client"
import type { ApiEnvelope } from "@/lib/http/types"
import type { MachineDowntime, MachineDowntimeInput } from "@/features/production/downtimes/api/types"

/** `from` bir pencere başı: o andan sonra biten (sürmekte ya da yaklaşan) duruşlar. */
export async function listMachineDowntimes(window: { from: string }): Promise<MachineDowntime[]> {
    const res = await protectedApiClient.get<ApiEnvelope<{ downtimes: MachineDowntime[] }>>(
        "/production/machine-downtimes",
        { params: window },
    )
    return res.data.payload.downtimes
}

export async function createMachineDowntime(input: MachineDowntimeInput): Promise<MachineDowntime> {
    const res = await protectedApiClient.post<ApiEnvelope<{ downtime: MachineDowntime }>>(
        "/production/machine-downtimes",
        input,
    )
    return res.data.payload.downtime
}

export async function updateMachineDowntime(id: string, input: Partial<MachineDowntimeInput>): Promise<MachineDowntime> {
    const res = await protectedApiClient.patch<ApiEnvelope<{ downtime: MachineDowntime }>>(
        `/production/machine-downtimes/${id}`,
        input,
    )
    return res.data.payload.downtime
}

export async function deleteMachineDowntime(id: string): Promise<void> {
    await protectedApiClient.delete(`/production/machine-downtimes/${id}`)
}
