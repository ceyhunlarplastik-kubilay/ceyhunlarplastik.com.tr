import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import type { ProductionAreaDto } from "@/core/helpers/prisma/productionAreas/repository"
import type { CalendarExceptionDto } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import type { MachineDowntimeDto } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import type { ProductionMachineDto } from "@/core/helpers/prisma/productionMachines/repository"
import type { MaterialWithProfileDto } from "@/core/helpers/prisma/productionMaterialProfiles/repository"
import type { MoldDto } from "@/core/helpers/prisma/productionMolds/repository"
import type { ProductionOperatorDto } from "@/core/helpers/prisma/productionOperators/repository"
import type { ProductionOrderDto } from "@/core/helpers/prisma/productionOrders/repository"
import type {
    ReferenceCustomerDto,
    ReferenceProductDto,
    ReferenceProductSizesDto,
    ReferenceProductVariantsDto,
} from "@/core/helpers/prisma/productionReferences/repository"
import type { ShiftPatternDto } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    listProductionAreasResponseValidator,
    productionAreaResponseValidator,
} from "@/functions/ProtectedApi/validators/productionAreas"
import {
    listProductionMachinesResponseValidator,
    productionMachineResponseValidator,
} from "@/functions/ProtectedApi/validators/productionMachines"
import {
    listShiftPatternsResponseValidator,
    shiftPatternResponseValidator,
} from "@/functions/ProtectedApi/validators/productionShiftPatterns"
import {
    listMoldsResponseValidator,
    moldResponseValidator,
} from "@/functions/ProtectedApi/validators/productionMolds"
import {
    listReferenceProductsResponseValidator,
    referenceProductSizesResponseValidator,
    referenceProductVariantsResponseValidator,
    searchReferenceCustomersResponseValidator,
} from "@/functions/ProtectedApi/validators/productionReferences"
import {
    deleteProductionOrderResponseValidator,
    listProductionOrdersResponseValidator,
    planProductionOrderResponseValidator,
    productionOrderCandidatesResponseValidator,
    productionOrderResponseValidator,
    pushJobFollowersResponseValidator,
    rescheduleProductionJobResponseValidator,
} from "@/functions/ProtectedApi/validators/productionOrders"
import type { OrderCandidate } from "@/core/helpers/production/orderCandidates"
import type { BoardJobDto, KanbanJobDto } from "@/core/helpers/prisma/productionJobs/repository"
import type { LotDetailDto, LotListItemDto } from "@/core/helpers/prisma/productionLots/repository"
import type { ShiftAssignmentDto } from "@/core/helpers/prisma/productionShiftAssignments/repository"
import { getProductionLotHandler, listProductionLotsHandler } from "@/functions/ProtectedApi/functions/productionLots/handlers"
import { getShiftAssignmentsHandler } from "@/functions/ProtectedApi/functions/productionShiftAssignments/handlers"
import {
    listProductionLotsResponseValidator,
    productionLotResponseValidator,
} from "@/functions/ProtectedApi/validators/productionLots"
import { shiftAssignmentsResponseValidator } from "@/functions/ProtectedApi/validators/productionShiftAssignments"
import type { ProductionReasonDto } from "@/core/helpers/prisma/productionReasons/repository"
import {
    createDefaultProductionReasonsResponseValidator,
    listProductionReasonsResponseValidator,
    productionReasonResponseValidator,
} from "@/functions/ProtectedApi/validators/productionReasons"
import {
    reportProductionLotResponseValidator,
    startProductionLotResponseValidator,
} from "@/functions/ProtectedApi/validators/productionLots"
import type { IGetProductionLotEvent, IListProductionLotsEvent } from "@/functions/ProtectedApi/types/productionLots"
import type { IGetShiftAssignmentsEvent } from "@/functions/ProtectedApi/types/productionShiftAssignments"
import {
    productionKanbanResponseValidator,
    transitionProductionJobResponseValidator,
} from "@/functions/ProtectedApi/validators/productionJobs"
import { getProductionBoardHandler } from "@/functions/ProtectedApi/functions/productionBoard/handlers"
import { productionBoardResponseValidator } from "@/functions/ProtectedApi/validators/productionBoard"
import type { IGetProductionBoardEvent } from "@/functions/ProtectedApi/types/productionBoard"
import {
    listMaterialProfilesResponseValidator,
    materialProfileResponseValidator,
} from "@/functions/ProtectedApi/validators/productionMaterialProfiles"
import {
    deleteProductionOperatorResponseValidator,
    listProductionOperatorsResponseValidator,
    productionOperatorResponseValidator,
} from "@/functions/ProtectedApi/validators/productionOperators"
import {
    bulkDeleteCalendarExceptionsResponseValidator,
    listCalendarExceptionsResponseValidator,
} from "@/functions/ProtectedApi/validators/productionCalendarExceptions"
import {
    deleteMachineDowntimeResponseValidator,
    listMachineDowntimesResponseValidator,
    machineDowntimeResponseValidator,
} from "@/functions/ProtectedApi/validators/productionMachineDowntimes"

/**
 * Response validator ↔ repository DTO sapma koruması (bkz. CLAUDE.md: şema handler'ın
 * dönüş tipine bağlı değildir; sapma kubi'de "Response object failed validation" 500'ü
 * olarak görünür). Fixture'lar DTO TİPİYLE yazıldı: repository bir alan eklerse/çıkarırsa
 * burası derlenmez; şema uyuşmazsa test düşer. Zarf `apiResponseDTO`'dan geçer ki
 * Date → ISO dönüşümü de sınansın.
 *
 * Bu dosya `validators/` altında DURAMAZ (validatorCompilation glob'u).
 */

const now = new Date("2026-09-25T08:00:00.000Z")

const shiftPattern: ShiftPatternDto = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Günde 24 saat · 3 × 8",
    isDefault: true,
    timezone: "Europe/Istanbul",
    notes: null,
    shifts: [
        {
            id: "22222222-2222-4222-8222-222222222222",
            code: "A",
            name: "Gündüz",
            startMinute: 480,
            durationMinutes: 480,
            daysOfWeek: [1, 2, 3, 4, 5, 6],
            sortOrder: 0,
        },
    ],
    machineCount: 2,
    areaCount: 1,
    createdAt: now,
    updatedAt: now,
}

const area: ProductionAreaDto = {
    id: "33333333-3333-4333-8333-333333333333",
    code: "P1",
    name: "Parkur 1",
    sortOrder: 0,
    isActive: true,
    notes: null,
    shiftPatternId: shiftPattern.id,
    shiftPattern: { id: shiftPattern.id, name: shiftPattern.name },
    machineCount: 1,
    createdAt: now,
    updatedAt: now,
}

const machine: ProductionMachineDto = {
    id: "44444444-4444-4444-8444-444444444444",
    code: "M-01",
    name: "Enjeksiyon 1",
    brand: "Yızumi",
    model: "UN120A5",
    serialNumber: null,
    manufactureYear: 2021,
    areaId: area.id,
    area: { id: area.id, code: area.code, name: area.name },
    status: "ACTIVE",
    clampForceTon: 120,
    tieBarHorizontalMm: 410,
    tieBarVerticalMm: 410,
    minMoldHeightMm: 150,
    maxMoldHeightMm: 480,
    maxOpeningStrokeMm: 390,
    maxDaylightMm: null,
    shotCapacityG: 185.5,
    screwDiameterMm: 40,
    locatingRingDiameterMm: 100,
    hotRunnerZones: 0,
    coreCircuits: 1,
    hasRobot: false,
    plannedEfficiencyPercent: 85,
    hourlyCost: 420.5,
    currency: "TRY",
    shiftPatternId: null,
    shiftPattern: null,
    sortOrder: 0,
    notes: null,
    createdAt: now,
    updatedAt: now,
}

const referenceProduct: ReferenceProductDto = {
    id: "55555555-5555-4555-8555-555555555555",
    code: "1.3",
    name: "Elcik Tipi Bakalit Tutamak",
    sizeCount: 2,
}

const sizeRef = {
    id: "66666666-6666-4666-8666-666666666666",
    code: 8,
    sizeCode: "1.3.8",
    label: "Elcik Çapı: 10 mm",
}

const referenceSizes: ReferenceProductSizesDto = {
    product: { id: referenceProduct.id, code: referenceProduct.code, name: referenceProduct.name },
    sizes: [{ ...sizeRef, variantCount: 3, moldCount: 1 }],
}

const mold: MoldDto = {
    id: "77777777-7777-4777-8777-777777777777",
    code: "K-1045",
    name: "Elcik 10 mm aile kalıbı",
    status: "ACTIVE",
    ownership: "COMPANY",
    ownerCustomerId: null,
    requiredClampForceTon: 90,
    widthMm: 350,
    heightMm: 300,
    thicknessMm: 280,
    weightKg: 180.5,
    requiredOpeningStrokeMm: null,
    locatingRingDiameterMm: 100,
    hotRunnerZones: 0,
    coreCircuitsRequired: 0,
    requiresRobot: false,
    standardCycleTimeSec: 22.5,
    runnerWeightG: 6.2,
    expectedScrapPercent: 1.5,
    setupMinutes: 45,
    totalShots: 120_000,
    maintenanceIntervalShots: 250_000,
    shotsAtLastMaintenance: 0,
    lastMaintenanceAt: now,
    storageLocation: "Raf B-3",
    notes: null,
    outputs: [{
        id: "88888888-8888-4888-8888-888888888888",
        productSizeId: sizeRef.id,
        cavities: 4,
        partWeightG: 12.4,
        product: { id: referenceProduct.id, code: referenceProduct.code, name: referenceProduct.name },
        size: sizeRef,
    }],
    machineProfiles: [{
        id: "99999999-9999-4999-8999-999999999999",
        machineId: machine.id,
        cycleTimeSec: 21,
        setupMinutes: null,
        isPreferred: true,
        isBlocked: false,
        notes: null,
        machine: { id: machine.id, code: machine.code, name: machine.name },
    }],
    createdAt: now,
    updatedAt: now,
}

const material: MaterialWithProfileDto = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Bakalit",
    code: "PF",
    profile: {
        isMoldResin: true,
        family: "PF",
        densityGCm3: 1.4,
        requiresDrying: false,
        dryingTempC: null,
        dryingHours: null,
        cycleTimeFactor: 1.2,
        purgeNote: null,
        updatedAt: now,
    },
}

const operator: ProductionOperatorDto = {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    firstName: "Ahmet",
    lastName: "Yılmaz",
    employeeNo: "CP-0123",
    phone: null,
    isActive: true,
    notes: null,
    createdAt: now,
    updatedAt: now,
}

const calendarException: CalendarExceptionDto = {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    date: "2026-05-27",
    kind: "HOLIDAY",
    note: "Kurban Bayramı",
    areaId: area.id,
    area: { id: area.id, code: area.code, name: area.name },
    machineId: null,
    machine: null,
    createdAt: now,
    updatedAt: now,
}

const downtime: MachineDowntimeDto = {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    machineId: machine.id,
    machine: { id: machine.id, code: machine.code, name: machine.name },
    startAt: new Date("2026-09-28T05:00:00.000Z"),
    endAt: new Date("2026-09-28T13:00:00.000Z"),
    kind: "PLANNED_MAINTENANCE",
    reason: null,
    createdByUserId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    createdByUser: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", firstName: null, lastName: "Kaya" },
    createdAt: now,
    updatedAt: now,
}

const version = { code: "V1", colorName: "Siyah", colorHex: "#000000", materials: ["PP"], materialIds: [material.id], signature: "color:c|materials:m" }
const moldSummary = { id: mold.id, code: mold.code, name: mold.name, status: "ACTIVE", cavities: 4 }

const referenceVariants: ReferenceProductVariantsDto = {
    product: { id: referenceProduct.id, code: referenceProduct.code, name: referenceProduct.name },
    sizes: [{ ...sizeRef, molds: [moldSummary], variants: [{ id: "abababab-abab-4bab-8bab-abababababab", fullCode: "1.3.8.V1", version }] }],
}

const customerRef: ReferenceCustomerDto = { id: "cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd", name: "Örnek Mobilya A.Ş." }

const order: ProductionOrderDto = {
    id: "efefefef-efef-4fef-8fef-efefefefefef",
    orderNumber: 1001,
    productVariantId: "abababab-abab-4bab-8bab-abababababab",
    variantCode: "1.3.8.V1",
    quantity: 100_000,
    dueDate: "2026-10-15",
    priority: "HIGH",
    source: "CUSTOMER_ORDER",
    customerId: customerRef.id,
    customer: customerRef,
    cycleTimeOverrideSec: null,
    status: "DRAFT",
    notes: null,
    createdByUserId: null,
    createdByUser: null,
    jobs: [{
        id: "12121212-1212-4212-8212-121212121212",
        lotBaseNumber: 1000,
        status: "PLANNED",
        machine: { id: machine.id, code: machine.code, name: machine.name },
        mold: { id: mold.id, code: mold.code, name: mold.name },
        setupStartAt: now,
        plannedEndAt: now,
        plannedQuantity: 101_528,
        lots: [{ lotNumber: "1000-1", sequence: 1, shiftDate: "2026-09-28", shiftCode: "A", plannedStartAt: now, plannedEndAt: now, plannedQuantity: 16_000 }],
    }],
    productVariant: {
        id: "abababab-abab-4bab-8bab-abababababab",
        fullCode: "1.3.8.V1",
        product: { id: referenceProduct.id, code: referenceProduct.code, name: referenceProduct.name },
        size: sizeRef,
        version,
        molds: [moldSummary],
    },
    createdAt: now,
    updatedAt: now,
}

function expectValid(schema: object, payload: Record<string, unknown>) {
    // @middy/validator'ın .d.ts'i dönüşü `Ajv` diye bildiriyor; çalışma zamanında
    // derlenmiş doğrulama fonksiyonu döner (productVariantMatrix/responseShape.test.ts).
    const validate = transpileSchema(schema) as unknown as ValidateFunction
    const valid = validate(JSON.parse(JSON.stringify(apiResponseDTO({ statusCode: 200, payload }))))

    expect(validate.errors ?? []).toEqual([])
    expect(valid).toBe(true)
}

describe("üretim tanımları — response validator ↔ DTO", () => {
    it("vardiya düzeni", () => {
        expectValid(listShiftPatternsResponseValidator, { shiftPatterns: [shiftPattern] })
        expectValid(shiftPatternResponseValidator, { shiftPattern })
    })

    it("parkur / alan (vardiya düzensiz alan dahil)", () => {
        expectValid(listProductionAreasResponseValidator, {
            areas: [area, { ...area, shiftPatternId: null, shiftPattern: null }],
        })
        expectValid(productionAreaResponseValidator, { area })
    })

    it("makine (saat maliyeti number olarak)", () => {
        expectValid(listProductionMachinesResponseValidator, { machines: [machine, { ...machine, hourlyCost: null }] })
        expectValid(productionMachineResponseValidator, { machine })
    })

    it("dar ürün sözlüğü (ürün modeli → ölçüler)", () => {
        expectValid(listReferenceProductsResponseValidator, { products: [referenceProduct] })
        expectValid(referenceProductSizesResponseValidator, referenceSizes)
    })

    it("kalıp (göz grupları + makine kartları; bakım tarihi boş olabilir)", () => {
        expectValid(listMoldsResponseValidator, { molds: [mold, { ...mold, lastMaintenanceAt: null, outputs: [], machineProfiles: [] }] })
        expectValid(moldResponseValidator, { mold })
    })

    it("hammadde üretim profili (profilsiz hammadde dahil)", () => {
        expectValid(listMaterialProfilesResponseValidator, { materials: [material, { ...material, code: null, profile: null }] })
        expectValid(materialProfileResponseValidator, { material })
    })

    it("operatör", () => {
        expectValid(listProductionOperatorsResponseValidator, { operators: [operator, { ...operator, employeeNo: null }] })
        expectValid(productionOperatorResponseValidator, { operator })
        expectValid(deleteProductionOperatorResponseValidator, { id: operator.id })
    })

    it("takvim istisnası (fabrika, alan ve makine kapsamı; tarih gün anahtarı olarak)", () => {
        expectValid(listCalendarExceptionsResponseValidator, {
            exceptions: [
                calendarException,
                { ...calendarException, areaId: null, area: null },
                {
                    ...calendarException,
                    areaId: null,
                    area: null,
                    machineId: machine.id,
                    machine: { id: machine.id, code: machine.code, name: machine.name },
                },
            ],
        })
        expectValid(bulkDeleteCalendarExceptionsResponseValidator, { deletedCount: 3 })
    })

    it("üretim emri (varyantı silinmiş ve terminsiz emir dahil) ve sözlükleri", () => {
        expectValid(listProductionOrdersResponseValidator, {
            data: [order, { ...order, productVariantId: null, productVariant: null, dueDate: null, customerId: null, customer: null }],
            meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
        })
        expectValid(productionOrderResponseValidator, { order })
        expectValid(deleteProductionOrderResponseValidator, { id: order.id })
        expectValid(referenceProductVariantsResponseValidator, referenceVariants)
        expectValid(searchReferenceCustomersResponseValidator, { customers: [customerRef] })

        const candidate: OrderCandidate = {
            machine: { id: machine.id, code: machine.code, name: machine.name },
            mold: { id: mold.id, code: mold.code, name: mold.name },
            cavities: 8,
            verdict: "ok",
            notes: [],
            isPreferred: true,
            cycleTimeSec: 17.5,
            cycleSource: "machineCard",
            shots: 12_691,
            setupMinutes: 40,
            productionMinutes: 4354.6,
            setupStartAt: now,
            productionStartAt: now,
            endAt: now,
            meetsDueDate: true,
            machineCost: 18_311.5,
            currency: "TRY",
            lots: [{ sequence: 1, workday: "2026-09-28", shiftCode: "A", startAt: now, endAt: now, shots: 2000, quantity: 16_000 }],
            isEarliest: true,
            isCheapest: true,
            missingShiftPattern: false,
        }
        expectValid(productionOrderCandidatesResponseValidator, {
            order: { id: order.id, orderNumber: 1001, quantity: 100_000, dueDate: null, variantCode: order.variantCode },
            generatedAt: now,
            horizonDays: 45,
            candidates: [candidate, { ...candidate, verdict: "unknown", endAt: null, setupStartAt: null, productionStartAt: null, meetsDueDate: false, machineCost: null, lots: [], missingShiftPattern: true }],
            excluded: [{ machineCode: "M-03", moldCode: "K-1001", reasons: ["Gerekli 30 t, makine 25 t — yetmez."] }],
        })
    })

    it("makine duruşu (giren kullanıcı silinmiş olabilir)", () => {
        expectValid(listMachineDowntimesResponseValidator, {
            downtimes: [downtime, { ...downtime, createdByUserId: null, createdByUser: null, reason: "Arıza" }],
        })
        expectValid(machineDowntimeResponseValidator, { downtime })
        expectValid(deleteMachineDowntimeResponseValidator, { id: downtime.id })
    })

    it("tahtada taşıma yanıtı", () => {
        expectValid(rescheduleProductionJobResponseValidator, {
            job: { id: order.id, version: 4, machineId: machine.id, setupStartAt: now, productionStartAt: now, plannedEndAt: now, lotCount: 3 },
            requestedStartAt: now,
            shifted: true,
            shiftedJobs: [{ id: order.id, lotBaseNumber: 1001, fromStartAt: now, toStartAt: now }],
        })
    })

    it("gecikme önerisi (sonrakileri tahmini bitişe kaydır) yanıtı", () => {
        expectValid(pushJobFollowersResponseValidator, {
            projectedEndAt: now,
            delayMinutes: 95.5,
            shiftedJobs: [{ id: order.id, lotBaseNumber: 1001, fromStartAt: now, toStartAt: now }],
        })
    })

    it("durum panosu (emri silinmiş yan ürün çıktısı dahil) ve geçiş yanıtı", () => {
        const kanbanJob: KanbanJobDto = {
            id: "16161616-1616-4616-8616-161616161616",
            lotBaseNumber: 1003,
            status: "RUNNING",
            version: 2,
            updatedAt: now,
            machine: { id: machine.id, code: machine.code, name: machine.name, area: { id: area.id, code: area.code, name: area.name } },
            mold: { id: mold.id, code: mold.code, name: mold.name },
            setupStartAt: now,
            productionStartAt: now,
            plannedEndAt: now,
            plannedShots: 2_500,
            colorHex: null,
            colorName: null,
            lotCount: 3,
            reportedLotCount: 1,
            outputs: [
                {
                    id: "17171717-1717-4717-8717-171717171717", cavities: 4, plannedQuantity: 10_000, goodQuantity: 0, scrapQuantity: 0,
                    reportedGoodQuantity: 3_900, reportedScrapQuantity: 100,
                    sizeCode: "1.3.8", productName: "Kare tapa",
                    order: { id: order.id, orderNumber: "UE-1001", variantCode: order.variantCode, quantity: 10_000, dueDate: null },
                },
                {
                    id: "18181818-1818-4818-8818-181818181818", cavities: 4, plannedQuantity: 10_000, goodQuantity: 0, scrapQuantity: 0,
                    reportedGoodQuantity: 0, reportedScrapQuantity: 0,
                    sizeCode: "1.5.4", productName: "Yuvarlak tapa", order: null,
                },
            ],
        }
        expectValid(productionKanbanResponseValidator, { generatedAt: now, completedWindowDays: 7, jobs: [kanbanJob] })
        expectValid(transitionProductionJobResponseValidator, {
            job: { id: kanbanJob.id, status: "COMPLETED", version: 3 },
            orders: [{ id: order.id, status: "COMPLETED" }],
        })
    })

    it("planla yanıtı (emir + kayma bilgisi)", () => {
        expectValid(planProductionOrderResponseValidator, { order, shifted: false, shiftedJobs: [] })
    })

    it("planlama tahtası — GERÇEK handler çıktısı (renksiz / emri silinmiş iş dahil)", async () => {
        const boardJob: BoardJobDto = {
            id: "13131313-1313-4313-8313-131313131313",
            lotBaseNumber: 1000,
            status: "PLANNED",
            version: 0,
            machineId: machine.id,
            mold: { id: mold.id, code: mold.code, name: mold.name, totalShots: 95_000, maintenanceIntervalShots: 100_000, shotsAtLastMaintenance: 0 },
            setupStartAt: new Date("2026-09-28T05:00:00.000Z"),
            productionStartAt: new Date("2026-09-28T05:45:00.000Z"),
            plannedEndAt: new Date("2026-09-28T22:05:00.000Z"),
            plannedShots: 3_000,
            cycleTimeSec: 18,
            efficiencyPercent: 85,
            setupMinutes: 45,
            colorHex: "#000000",
            colorName: "Siyah",
            outputs: [{
                productSizeId: sizeRef.id,
                cavities: 4,
                plannedQuantity: 12_000,
                order: { id: order.id, orderNumber: "UE-1001", variantCode: order.variantCode, quantity: 12_000, dueDate: "2026-10-15" },
            }],
            lots: [
                {
                    lotNumber: "1000-1", sequence: 1, shiftDate: "2026-09-28", shiftCode: "A", plannedStartAt: now, plannedEndAt: now, plannedShots: 1_000,
                    status: "COMPLETED", actualStartAt: now, actualEndAt: now, actualShots: 900, reported: true,
                },
                {
                    lotNumber: "1000-2", sequence: 2, shiftDate: "2026-09-28", shiftCode: "B", plannedStartAt: now, plannedEndAt: now, plannedShots: 1_000,
                    status: "RUNNING", actualStartAt: now, actualEndAt: null, actualShots: null, reported: false,
                },
            ],
        }
        const handler = getProductionBoardHandler({
            productionMachineRepository: { listMachines: async () => [machine, { ...machine, id: "45454545-4545-4545-8545-454545454545", status: "INACTIVE" }] },
            productionAreaRepository: { listAreas: async () => [area] },
            productionShiftPatternRepository: { listShiftPatterns: async () => [shiftPattern] },
            productionCalendarExceptionRepository: { listExceptions: async () => [{ ...calendarException, date: "2026-09-29" }] },
            productionMachineDowntimeRepository: { listDowntimes: async () => [downtime] },
            productionMoldRepository: { listMolds: async () => [mold] },
            productionOrderRepository: {
                listOrders: async () => ({
                    // Varyantı silinmiş emir panelde gösterilmez (planlanamaz).
                    data: [order, { ...order, id: "15151515-1515-4515-8515-151515151515", productVariant: null }],
                    meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
                }),
            },
            productionJobRepository: {
                listBoardJobs: async () => [boardJob, { ...boardJob, id: "14141414-1414-4414-8414-141414141414", colorHex: null, colorName: null, outputs: [{ ...boardJob.outputs[0], order: null }] }],
            },
        } as never)
        const response = await handler({ queryStringParameters: { from: "2026-09-28", to: "2026-09-29" } } as unknown as IGetProductionBoardEvent)

        const validate = transpileSchema(productionBoardResponseValidator) as unknown as ValidateFunction
        const valid = validate(JSON.parse(JSON.stringify(response)))
        expect(validate.errors ?? []).toEqual([])
        expect(valid).toBe(true)

        const payload = (response.body as unknown as { payload: {
            machines: Array<{ id: string; shifts: unknown[]; dayExceptions: unknown[] }>
            pendingOrders: Array<{ id: string; machineFit: unknown[] }>
            jobs: Array<{ forecast: { reportedShots: number }; moldMaintenance: { level: string } }>
        } }).payload
        expect(payload.jobs[0].forecast.reportedShots).toBe(900)
        expect(payload.jobs[0].moldMaintenance.level).toBe("SOON")
        expect(payload.pendingOrders.map((entry) => entry.id)).toEqual([order.id])
        expect(payload.pendingOrders[0].machineFit).toHaveLength(1)
        expect(payload.machines.map((entry) => entry.id)).toEqual([machine.id])
        expect(payload.machines[0].shifts.length).toBeGreaterThan(0)
        expect(payload.machines[0].dayExceptions).toEqual([{ date: "2026-09-29", kind: "HOLIDAY" }])
    })

    const operatorRef = { id: operator.id, firstName: operator.firstName, lastName: operator.lastName, employeeNo: operator.employeeNo, isActive: true }
    const lotItem: LotListItemDto = {
        id: "19191919-1919-4919-8919-191919191919",
        lotNumber: "1000-2",
        sequence: 2,
        shiftDate: "2026-09-28",
        shiftCode: "B",
        plannedStartAt: now,
        plannedEndAt: now,
        plannedShots: 1_000,
        status: "COMPLETED",
        actualStartAt: now,
        actualEndAt: now,
        actualShots: 1_010,
        reportedAt: now,
        stopMinutes: 45,
        job: {
            id: "12121212-1212-4212-8212-121212121212",
            lotBaseNumber: 1000,
            status: "RELEASED",
            version: 3,
            machine: { id: machine.id, code: machine.code, name: machine.name },
            mold: { id: mold.id, code: mold.code, name: mold.name },
        },
        colorHex: null,
        colorName: null,
        outputs: [
            {
                jobOutputId: "17171717-1717-4717-8717-171717171717", sizeCode: "1.3.8", productName: "Kare tapa", cavities: 4,
                plannedQuantity: 4_000, goodQuantity: 3_900, scrapQuantity: 100,
                scrapReasons: [{ reason: { id: "24242424-2424-4424-8424-242424242424", code: "F01", name: "Çapak" }, quantity: 60 }],
                order: { id: order.id, orderNumber: "UE-1001", variantCode: order.variantCode, quantity: 10_000, dueDate: null },
            },
            {
                jobOutputId: "18181818-1818-4818-8818-181818181818", sizeCode: "1.5.4", productName: "Yuvarlak tapa", cavities: 4,
                plannedQuantity: 4_000, goodQuantity: 0, scrapQuantity: 0, scrapReasons: [], order: null,
            },
        ],
        lotOperators: [],
        noteCount: 1,
    }
    const assignment: ShiftAssignmentDto = { machineId: machine.id, shiftDate: "2026-09-28", shiftCode: "B", operator: operatorRef }

    function validateEnvelope(schema: object, response: unknown) {
        const validate = transpileSchema(schema) as unknown as ValidateFunction
        const valid = validate(JSON.parse(JSON.stringify(response)))
        expect(validate.errors ?? []).toEqual([])
        expect(valid).toBe(true)
    }

    it("lot listesi — GERÇEK handler (ekip vardiya ekibinden türetilir; lota özel ekipli lot dahil)", async () => {
        const handler = listProductionLotsHandler({
            productionLotRepository: {
                listLots: async () => ({
                    data: [lotItem, { ...lotItem, id: "20202020-2020-4020-8020-202020202020", lotNumber: "1000-3", lotOperators: [{ ...operatorRef, isActive: false }] }],
                    meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
                }),
            },
            productionShiftAssignmentRepository: { listForCells: async () => [assignment] },
        } as never)
        const response = await handler({ queryStringParameters: { from: "2026-09-28", to: "2026-09-30" } } as unknown as IListProductionLotsEvent)
        validateEnvelope(listProductionLotsResponseValidator, response)
        const payload = (response.body as unknown as { payload: { data: Array<{ operators: { source: string } }>; range: unknown } }).payload
        expect(payload.data.map((lot) => lot.operators.source)).toEqual(["roster", "lot"])
        expect(payload.range).toEqual({ from: "2026-09-28", to: "2026-09-30" })
    })

    it("lot ayrıntısı — GERÇEK handler (notlar, kardeş lotlar, silme yetkisi)", async () => {
        const detail: LotDetailDto = {
            ...lotItem,
            job: { ...lotItem.job, setupStartAt: now, productionStartAt: now, plannedEndAt: now, plannedShots: 2_000, cycleTimeSec: 18 },
            siblings: [
                { lotNumber: "1000-1", sequence: 1, shiftDate: "2026-09-28", shiftCode: "A", plannedStartAt: now, plannedEndAt: now, status: "COMPLETED", reportedAt: now },
                { lotNumber: "1000-2", sequence: 2, shiftDate: "2026-09-28", shiftCode: "B", plannedStartAt: now, plannedEndAt: now, status: "COMPLETED", reportedAt: null },
            ],
            reportedBy: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", firstName: null, lastName: "Kaya" },
            stops: [
                {
                    id: "25252525-2525-4525-8525-252525252525", durationMinutes: 45, startAt: null, note: null,
                    reason: { id: "26262626-2626-4626-8626-262626262626", code: "D01", name: "Kalıp arızası", stopCategory: "BREAKDOWN" },
                },
            ],
            notes: [
                {
                    id: "21212121-2121-4121-8121-212121212121", category: "QUALITY", body: "Renk tonu açık.", createdAt: now,
                    authorUserId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                    author: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", firstName: null, lastName: "Kaya" },
                    operator: operatorRef,
                },
                { id: "22222222-2222-4222-8222-222222222223", category: "GENERAL", body: "Yazarı silinmiş not", createdAt: now, authorUserId: null, author: null, operator: null },
            ],
        }
        const handler = getProductionLotHandler({
            productionLotRepository: { getLotDetail: async () => detail },
            productionShiftAssignmentRepository: { listForCells: async () => [assignment] },
        } as never)
        const response = await handler({
            pathParameters: { lotNumber: "1000-2" },
            user: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", isAdmin: false, isOwner: false },
        } as unknown as IGetProductionLotEvent)
        validateEnvelope(productionLotResponseValidator, response)
        const lot = (response.body as unknown as { payload: { lot: { notes: Array<{ canDelete: boolean }>; operators: { source: string } } } }).payload.lot
        expect(lot.notes.map((note) => note.canDelete)).toEqual([true, false])
        expect(lot.operators.source).toBe("roster")
    })

    it("vardiya ekibi — GERÇEK handler (düzen dışı kalmış atama ve pasif makine)", async () => {
        const handler = getShiftAssignmentsHandler({
            productionMachineRepository: { listMachines: async () => [machine, { ...machine, id: "45454545-4545-4545-8545-454545454545", status: "INACTIVE" }] },
            productionAreaRepository: { listAreas: async () => [area] },
            productionShiftPatternRepository: { listShiftPatterns: async () => [shiftPattern] },
            productionCalendarExceptionRepository: { listExceptions: async () => [] },
            productionShiftAssignmentRepository: {
                listForDates: async () => [
                    { ...assignment, shiftCode: "A" },
                    // Düzende B yok → düzen dışı.
                    assignment,
                ],
            },
            productionOperatorRepository: { listOperators: async () => [operator, { ...operator, id: "23232323-2323-4323-8323-232323232323", isActive: false }] },
        } as never)
        const response = await handler({ queryStringParameters: { date: "2026-09-28" } } as unknown as IGetShiftAssignmentsEvent)
        validateEnvelope(shiftAssignmentsResponseValidator, response)
        const payload = (response.body as unknown as { payload: {
            machines: Array<{ shifts: Array<{ code: string; operatorIds: string[] }>; orphans: Array<{ shiftCode: string }> }>
            operators: unknown[]
        } }).payload
        expect(payload.machines).toHaveLength(1)
        expect(payload.machines[0].shifts).toEqual([expect.objectContaining({ code: "A", operatorIds: [operator.id] })])
        expect(payload.machines[0].orphans).toEqual([expect.objectContaining({ shiftCode: "B" })])
        expect(payload.operators).toHaveLength(1)
    })

    it("duruş / fire nedenleri (fire nedeninde kategori yok)", () => {
        const reason: ProductionReasonDto = {
            id: "26262626-2626-4626-8626-262626262626", kind: "STOP", code: "D01", name: "Kalıp arızası", stopCategory: "BREAKDOWN",
            isActive: true, sortOrder: 0, usageCount: 3, createdAt: now, updatedAt: now,
        }
        expectValid(listProductionReasonsResponseValidator, {
            reasons: [reason, { ...reason, id: "27272727-2727-4727-8727-272727272727", kind: "SCRAP", code: "F01", name: "Çapak", stopCategory: null, usageCount: 0 }],
        })
        expectValid(productionReasonResponseValidator, { reason })
        expectValid(createDefaultProductionReasonsResponseValidator, { created: 22 })
    })

    it("lot başlatma ve vardiya raporu yanıtları", () => {
        expectValid(startProductionLotResponseValidator, { lotNumber: "1000-2", jobVersion: 4 })
        expectValid(reportProductionLotResponseValidator, { lotNumber: "1000-2", jobVersion: 5, shots: 1_010, nextLotNumber: "1000-3", correction: false })
        expectValid(reportProductionLotResponseValidator, { lotNumber: "1000-3", jobVersion: 6, shots: 900, nextLotNumber: null, correction: true })
    })
})
