import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionOrderRepository } from "@/core/helpers/prisma/productionOrders/repository"
import type { IPrismaProductionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import type { IPrismaProductionJobRepository } from "@/core/helpers/prisma/productionJobs/repository"
import type { IPrismaProductionCalendarExceptionRepository } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import type { IPrismaProductionMachineDowntimeRepository } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import type { IPrismaProductionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import type { IPrismaProductionMaterialProfileRepository } from "@/core/helpers/prisma/productionMaterialProfiles/repository"
import type { IPrismaProductionMoldRepository } from "@/core/helpers/prisma/productionMolds/repository"
import type { IPrismaProductionReferenceRepository } from "@/core/helpers/prisma/productionReferences/repository"
import type { IPrismaProductionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import type {
    ProductionOrderSource,
    ProductionOrderStatus,
    ProductionPriority,
} from "@/prisma/generated/prisma/client"

export interface IProductionOrderDependencies {
    productionOrderRepository: IPrismaProductionOrderRepository
    productionReferenceRepository: IPrismaProductionReferenceRepository
}

export type IProductionOrderBody = {
    productVariantId: string
    quantity: number
    /** "YYYY-MM-DD" */
    dueDate?: string | null
    priority?: ProductionPriority
    source?: ProductionOrderSource
    customerId?: string | null
    cycleTimeOverrideSec?: number | null
    notes?: string | null
}

/** Durum yalnız güncellemede ve yalnız elle verilebilenler arasında (core kuralı). */
export type IUpdateProductionOrderBody = Partial<IProductionOrderBody> & { status?: ProductionOrderStatus }

/** `durum`: "open" (varsayılan — kapanmamışlar), "all" ya da tek bir durum. */
export type IListProductionOrdersQuery = {
    page?: string
    limit?: string
    q?: string
    status?: "open" | "all" | ProductionOrderStatus
}

export type IListProductionOrdersEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, unknown, IListProductionOrdersQuery | undefined>

export type ICreateProductionOrderEvent = IAPIGatewayProxyEventWithUserGeneric<IProductionOrderBody>

export type IUpdateProductionOrderEvent = IAPIGatewayProxyEventWithUserGeneric<IUpdateProductionOrderBody, { id: string }>

/** "Öner": emri basabilecek kalıp × makine planları — tanımların tamamını okur. */
export interface IProductionOrderPlanningDependencies {
    productionOrderRepository: IPrismaProductionOrderRepository
    productionMoldRepository: IPrismaProductionMoldRepository
    productionMachineRepository: IPrismaProductionMachineRepository
    productionAreaRepository: IPrismaProductionAreaRepository
    productionShiftPatternRepository: IPrismaProductionShiftPatternRepository
    productionCalendarExceptionRepository: IPrismaProductionCalendarExceptionRepository
    productionMachineDowntimeRepository: IPrismaProductionMachineDowntimeRepository
    productionMaterialProfileRepository: IPrismaProductionMaterialProfileRepository
    productionJobRepository: IPrismaProductionJobRepository
}

export type IGetProductionOrderCandidatesEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>

/**
 * Çakışma kipi: `first-gap` istenen andan sonraki ilk boşluk (varsayılan); `push-later` iş o ana
 * yerleşir, makinede o andan sonra başlayan planlı işler arkasına kaydırılır.
 */
export type ProductionPlacementMode = "first-gap" | "push-later"

/** Kalıp verilmezse o makinede en erken biten kalıp; `startAt` en erken başlangıç (ISO). */
export type IPlanProductionOrderBody = { machineId: string; moldId?: string; startAt?: string; placement?: ProductionPlacementMode }

export type IPlanProductionOrderEvent = IAPIGatewayProxyEventWithUserGeneric<IPlanProductionOrderBody, { id: string }>

export type IDeleteProductionJobEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>

/** Tahtada taşıma: hedef makine + istenen en erken bağlama başı (ISO) + iyimser kilit. */
export type IRescheduleProductionJobBody = {
    machineId: string
    startAt: string
    expectedVersion: number
    placement?: ProductionPlacementMode
}

export type IRescheduleProductionJobEvent = IAPIGatewayProxyEventWithUserGeneric<IRescheduleProductionJobBody, { id: string }>

/** Geciken (sahaya verilmiş) işin tahmini bitişine göre makinedeki planlı işleri kaydırır. */
export type IPushJobFollowersEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>

export type IDeleteProductionOrderEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>
