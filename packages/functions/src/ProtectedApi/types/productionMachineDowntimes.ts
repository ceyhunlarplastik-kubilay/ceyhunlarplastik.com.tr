import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionMachineDowntimeRepository } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import type { IPrismaProductionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import type { MachineDowntimeKind } from "@/prisma/generated/prisma/client"

export interface IProductionMachineDowntimeDependencies {
    productionMachineDowntimeRepository: IPrismaProductionMachineDowntimeRepository
    productionMachineRepository: IPrismaProductionMachineRepository
}

/** Zamanlar ISO 8601 (UTC); fabrika saatine çevirme istemcide (core `productionTime.ts`). */
export type IMachineDowntimeBody = {
    machineId: string
    startAt: string
    endAt: string
    kind: MachineDowntimeKind
    reason?: string | null
}

export type IListMachineDowntimesEvent = IAPIGatewayProxyEventWithUserGeneric<
    unknown,
    unknown,
    { machineId?: string; from?: string; to?: string } | undefined
>

export type ICreateMachineDowntimeEvent = IAPIGatewayProxyEventWithUserGeneric<IMachineDowntimeBody>

export type IUpdateMachineDowntimeEvent = IAPIGatewayProxyEventWithUserGeneric<
    Partial<IMachineDowntimeBody>,
    { id: string }
>

export type IDeleteMachineDowntimeEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>
