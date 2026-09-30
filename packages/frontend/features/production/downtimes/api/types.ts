import type { MachineDowntimeKind } from "@/features/production/shared/downtimeKinds"

export type MachineDowntime = {
    id: string
    machineId: string
    machine: { id: string; code: string; name: string }
    /** ISO 8601 (UTC); ekranda fabrika saatiyle gösterilir (core `productionTime.ts`). */
    startAt: string
    endAt: string
    kind: MachineDowntimeKind
    reason: string | null
    createdByUserId: string | null
    createdByUser: { id: string; firstName: string | null; lastName: string | null } | null
    createdAt: string
    updatedAt: string
}

export type MachineDowntimeInput = {
    machineId: string
    startAt: string
    endAt: string
    kind: MachineDowntimeKind
    reason: string | null
}
