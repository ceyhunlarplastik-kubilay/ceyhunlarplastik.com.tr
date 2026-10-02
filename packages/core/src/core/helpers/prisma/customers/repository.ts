import createError from "http-errors"

import { prisma } from "@/core/db/prisma"
import { diffAuditSnapshots } from "@/core/helpers/audit/auditDiff"
import { writeAuditLog, writeAuditLogs, type AuditLogEntry } from "@/core/helpers/audit/writeAuditLog"
import type { AuditContext, AuditMetadata } from "@/core/helpers/audit/types"
import {
    customerAuditInclude,
    customerAuditLabel,
    customerAuditUserLabel,
    toCustomerAuditSnapshot,
    type CustomerAuditRow,
} from "@/core/helpers/crm/customerAudit"
import {
    LEAD_CUSTOMER_DELETION_COUNT_SELECT,
    planLeadCustomerDeletion,
    type LeadCustomerDeletionPlan,
} from "@/core/helpers/crm/leadCustomerDeletion"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { normalizeCompanyContactAssignments } from "@/core/helpers/crm/companyContactAssignments"
import { GOOGLE_PLACES_PROVIDER } from "@/core/helpers/crm/customerAddressInput"
import { decimalLikeToNumber } from "@/core/helpers/pricing/productVariantSupplier"
import { buildCustomerAddressSummary } from "@/core/helpers/crm/customerAddressSummary"
import {
    CustomerAddressLocationAccuracy,
    CustomerAddressLocationSource,
    CustomerStatus,
    CustomerVisitStatus,
    CustomerVisitType,
    CustomerVisitOutcome,
} from "@/prisma/generated/prisma/enums"
import { Customer, CustomerAssignedProductSource, Prisma } from "@/prisma/generated/prisma/client"
import { productVariantStructureIncludeBasic } from "@/core/helpers/prisma/productVariants/repository"

const customerUserSummarySelect = {
    id: true,
    email: true,
    identifier: true,
    firstName: true,
    lastName: true,
    groups: true,
    imageKey: true,
    phone: true,
    customerContactTitle: true,
    customerContactDepartment: true,
    isPrimaryCustomerContact: true,
    customerInvitations: {
        orderBy: [
            { createdAt: "desc" },
            { id: "desc" },
        ],
        take: 1,
        select: {
            acceptedAt: true,
            expiresAt: true,
            requestedFirstName: true,
            requestedLastName: true,
            requestedCustomerContactTitle: true,
            requestedCustomerContactDepartment: true,
            requestedIsPrimaryCustomerContact: true,
        },
    },
} as any

/**
 * Ek telefonların API'ye çıkan şekli. Veri girişi yüzeyi (`leadCustomers.ts`)
 * de bunu kullanır; oradaki yanıt şeması KATI olduğu için alan listesi
 * `leadCustomerSummarySchema` ile birebir aynı kalmalı.
 */
export const customerPhoneSelect = {
    id: true,
    number: true,
    label: true,
    displayOrder: true,
} satisfies Prisma.CustomerPhoneSelect

export const customerPhoneOrderBy = [
    { displayOrder: "asc" },
    { createdAt: "asc" },
] satisfies Prisma.CustomerPhoneOrderByWithRelationInput[]

/**
 * Birincil `phone`'a ek olarak EK numaralarda da arar — satış temsilcisi
 * muhasebeden arayan numarayla da müşteriyi bulabilmeli.
 */
export function buildCustomerAdditionalPhoneSearchWhere(search: string): Prisma.CustomerWhereInput {
    return {
        additionalPhones: {
            some: {
                number: { contains: search, mode: "insensitive" },
            },
        },
    }
}

const customerBaseInclude = {
    // Birincil numara `Customer.phone` skaler alanında; bunlar EK numaralar.
    additionalPhones: {
        select: customerPhoneSelect,
        orderBy: customerPhoneOrderBy,
    },
    sectorValue: {
        include: {
            attribute: true,
            assets: true,
        },
    },
    productionGroupValue: {
        include: {
            attribute: true,
            assets: true,
        },
    },
    usageAreaValues: {
        include: {
            attribute: true,
            assets: true,
        },
    },
    attributeValueAssignments: {
        include: {
            attributeValue: {
                include: {
                    attribute: true,
                    assets: true,
                    parentValue: {
                        include: {
                            attribute: true,
                            assets: true,
                            parentValue: {
                                include: {
                                    attribute: true,
                                    assets: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: [
            {
                createdAt: "asc",
            },
        ],
    },
    assignedSalesUser: {
        select: customerUserSummarySelect,
    },
    convertedByUser: {
        select: customerUserSummarySelect,
    },
    companyContactAssignments: {
        orderBy: [
            { displayOrder: "asc" },
            { createdAt: "asc" },
        ],
        include: {
            companyContact: true,
        },
    },
} satisfies Prisma.CustomerInclude

// Neon gibi uzak PostgreSQL bağlantılarında art arda gelen adres yazmaları,
// Prisma'nın interaktif transaction için varsayılan 5 saniyelik süresini
// zaman zaman aşabiliyor. Transaction içinde yalnız atomik olması gereken
// yazmaları tutuyor, yine de ağ dalgalanmaları için sınırlı bir pay bırakıyoruz.
const addressTransactionOptions = {
    maxWait: 5_000,
    timeout: 15_000,
} as const

/** Harita tek görünümde sınırsız pin çizmez; yakınlaşma zaten daraltır. */
const MAP_CUSTOMER_LIMIT = 500

// "İlgili Ürünler" ürün ağacı: portal profil-eşleşmesi sorgusu (`.product.include`)
// ve `customerAssignedProductVariantInclude` bu şekli paylaşır.
export const customerProductInclude = {
    product: {
        include: {
            category: true,
            assets: true,
            attributeValues: {
                include: {
                    attribute: true,
                    parentValue: {
                        include: {
                            attribute: true,
                            parentValue: {
                                include: {
                                    attribute: true,
                                },
                            },
                        },
                    },
                },
            },
            industrialUsages: {
                orderBy: {
                    displayOrder: "asc",
                },
                include: {
                    sectorValue: {
                        include: {
                            attribute: true,
                        },
                    },
                    productionGroupValue: {
                        include: {
                            attribute: true,
                            parentValue: {
                                include: {
                                    attribute: true,
                                },
                            },
                        },
                    },
                    usageAreaValue: {
                        include: {
                            attribute: true,
                            parentValue: {
                                include: {
                                    attribute: true,
                                    parentValue: {
                                        include: {
                                            attribute: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
} satisfies { product: { include: Prisma.ProductInclude } }

export const customerAssignedProductVariantInclude = {
    createdByUser: {
        select: customerUserSummarySelect,
    },
    productVariant: {
        include: {
            product: customerProductInclude.product,
            ...productVariantStructureIncludeBasic,
            assets: true,
        },
    },
} satisfies Prisma.CustomerAssignedProductInclude

const customerDetailInclude = {
    ...customerBaseInclude,
    assignedProducts: {
        orderBy: {
            displayOrder: "asc",
        },
        include: customerAssignedProductVariantInclude,
    },
    portalUsers: {
        orderBy: [
            { isPrimaryCustomerContact: "desc" },
            { createdAt: "asc" },
        ],
        select: customerUserSummarySelect,
    },
    addresses: {
        orderBy: [
            { isPrimary: "desc" },
            { displayOrder: "asc" },
            { createdAt: "asc" },
        ],
        include: {
            countryRef: {
                select: {
                    id: true,
                    name: true,
                    iso2: true,
                },
            },
            stateRef: {
                select: {
                    id: true,
                    name: true,
                },
            },
            cityRef: {
                select: {
                    id: true,
                    name: true,
                },
            },
            locationVerifiedByUser: {
                select: customerUserSummarySelect,
            },
        },
    },
    visits: {
        orderBy: [
            { scheduledAt: "desc" },
            { createdAt: "desc" },
        ],
        include: {
            ownerUser: {
                select: customerUserSummarySelect,
            },
            createdByUser: {
                select: customerUserSummarySelect,
            },
        },
    },
} satisfies Prisma.CustomerInclude

// Panel ilk-yük pattern'i: portal overview sayfası ürünleri RENDER ETMEZ, yalnız
// sayaçlarını gösterir. customerDetailInclude'un en ağır kısmı olan
// assignedProducts ürün ağacı (ürün başına ~175KB sınıfı) burada _count'a
// indirilir; profil/iletişim/adres/kullanım-alanı blokları kalır. "İlgili Ürünler"
// sayısı artık profil eşleşmesinden türediği için burada sayaç yok.
const customerPortalOverviewInclude = {
    ...customerBaseInclude,
    portalUsers: customerDetailInclude.portalUsers,
    addresses: customerDetailInclude.addresses,
    _count: {
        select: {
            assignedProducts: true,
        },
    },
} satisfies Prisma.CustomerInclude

export type CustomerWithRelations = Prisma.CustomerGetPayload<{
    include: typeof customerBaseInclude
}>

export type CustomerPortalOverview = Prisma.CustomerGetPayload<{
    include: typeof customerPortalOverviewInclude
}>

export type CustomerDetail = Prisma.CustomerGetPayload<{
    include: typeof customerDetailInclude
}>

export type CustomerAttributeValueAssignmentWithRelations = Prisma.CustomerAttributeValueAssignmentGetPayload<{
    include: typeof customerBaseInclude.attributeValueAssignments.include
}>

export type CustomerAssignedProductWithRelations = Prisma.CustomerAssignedProductGetPayload<{
    include: typeof customerAssignedProductVariantInclude
}>

export type CustomerAddressRecord = Prisma.CustomerAddressGetPayload<{
    include: typeof customerDetailInclude.addresses.include
}>

export type CustomerVisitWithRelations = Prisma.CustomerVisitGetPayload<{
    include: typeof customerDetailInclude.visits.include
}>

// Çapraz-müşteri rapor sorgusu: `listVisits` gibi tek müşteriye kilitli değil,
// bu yüzden müşteri özeti (temsilci/il-ilçe filtreleriyle birlikte gösterilecek
// firma adı) ve ziyaret edilen adresin il/ilçe bilgisini de taşır.
const customerVisitReportInclude = {
    ownerUser: {
        select: customerUserSummarySelect,
    },
    createdByUser: {
        select: customerUserSummarySelect,
    },
    customer: {
        select: {
            id: true,
            companyName: true,
            fullName: true,
            status: true,
            assignedSalesUserId: true,
        },
    },
    address: {
        select: {
            id: true,
            label: true,
            city: true,
            district: true,
            stateId: true,
            cityId: true,
            stateRef: { select: { id: true, name: true } },
            cityRef: { select: { id: true, name: true } },
        },
    },
} satisfies Prisma.CustomerVisitInclude

export type CustomerVisitReportRecord = Prisma.CustomerVisitGetPayload<{
    include: typeof customerVisitReportInclude
}>

export type CustomerAddressMutationInput = {
    label: string
    contactName?: string | null
    phone?: string | null
    email?: string | null
    countryId?: number | null
    stateId?: number | null
    cityId?: number | null
    country?: string | null
    city: string
    district?: string | null
    line1: string
    line2?: string | null
    postalCode?: string | null
    taxOffice?: string | null
    taxNumber?: string | null
    latitude?: number | null
    longitude?: number | null
    locationSource?: CustomerAddressLocationSource | null
    locationAccuracy?: CustomerAddressLocationAccuracy | null
    geocodingProvider?: string | null
    geocodingPlaceId?: string | null
    geocodingLabel?: string | null
    geocodingRaw?: Prisma.InputJsonValue | null
    geocodedAt?: Date | null
    geocodingExpiresAt?: Date | null
    locationVerifiedAt?: Date | null
    locationVerifiedByUserId?: string | null
    isPrimary?: boolean
    isBilling?: boolean
    isShipping?: boolean
    note?: string | null
}

export type CustomerMapPointRecord = {
    customerId: string
    companyName?: string | null
    fullName: string | null
    email: string
    phone: string
    status: CustomerStatus
    assignedSalesUserId?: string | null
    addressId: string
    addressLabel: string
    addressSummary: string
    latitude: number
    longitude: number
    isPrimary: boolean
    isShipping: boolean
    /**
     * Adres Google Places'ten geldiyse ("google_places") harita popup'ında native
     * Google işletme kartı gösterilir; aksi halde CRM'deki adres metni.
     */
    geocodingProvider: string | null
    geocodingPlaceId: string | null
}

export interface IPrismaCustomerRepository {
    listCustomers(
        query: IPaginationQuery & {
            sectorValueId?: string
            productionGroupValueId?: string
            usageAreaValueId?: string
            status?: CustomerStatus
            assignedSalesUserId?: string
            /** Adres filtresi — normalize geo FK'ları (ülke → il → ilçe), en az bir adresi eşleşen müşteriler. */
            countryId?: number
            stateId?: number
            cityId?: number
        }
    ): Promise<{
        data: CustomerWithRelations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getCustomer(id: string): Promise<CustomerDetail | null>
    /**
     * P2.8(a): Yalnız fiyat bağlamı için DAR sorgu. `getCustomer` müşteri detayının
     * tüm relation'larını çeker; portal fiyat hesabı için tek alan yeterli.
     */
    getCustomerPricingContext(id: string): Promise<{ generalDiscountPercent: Prisma.Decimal | null } | null>
    /**
     * Portal overview: ürün ağaçları yerine _count taşıyan hafif müşteri profili
     * (panel ilk-yük pattern'i — sayfa ürünleri render etmez, yalnız sayar).
     */
    getCustomerPortalOverview(id: string): Promise<CustomerPortalOverview | null>
    // Customer'a yazan her metod `audit`'i ZORUNLU alır: denetim kaydı değişiklikle aynı
    // transaction'da yazılır (bkz. dosyadaki "DENETİMLİ YAZMA" bölümü).
    /** `address` verilirse müşteriyle AYNI transaction'da yazılır (yarım kayıt kalmaz). */
    createCustomer(
        data: Prisma.CustomerCreateInput,
        audit: AuditContext,
        options?: { address?: CustomerAddressMutationInput | null },
    ): Promise<CustomerWithRelations>
    /**
     * İletişim kişisi ataması ve profil ataması temizliği aynı transaction'da: eskiden
     * müşteri ve iletişim ataması iki ayrı yazmaydı, ikincisi düşerse ilki kalıyordu.
     */
    updateCustomer(
        id: string,
        data: Prisma.CustomerUpdateInput,
        audit: AuditContext,
        options?: {
            companyContactAssignments?: Array<{
                companyContactId: string
                isActive?: boolean
                displayOrder?: number
                note?: string | null
            }>
            /** Bu attribute kodlarındaki mevcut profil atamaları yazmadan önce silinir. */
            replaceAttributeAssignmentCodes?: string[]
        },
    ): Promise<CustomerWithRelations>
    createAddress(
        customerId: string,
        data: CustomerAddressMutationInput,
        audit: AuditContext,
    ): Promise<CustomerDetail>
    getAddress(customerId: string, addressId: string): Promise<CustomerAddressRecord | null>
    updateAddress(customerId: string, addressId: string, data: CustomerAddressMutationInput, audit: AuditContext): Promise<CustomerDetail>
    deleteAddress(customerId: string, addressId: string, audit: AuditContext): Promise<CustomerDetail>
    listCustomersForMap(query: {
        north: number
        south: number
        east: number
        west: number
        search?: string
        status?: CustomerStatus
        assignedSalesUserId?: string
        sectorValueId?: string
        usageAreaValueId?: string
        countryId?: number
        stateId?: number
        cityId?: number
    }): Promise<CustomerMapPointRecord[]>
    convertCustomer(
        id: string,
        convertedByUserId: string,
        audit: AuditContext,
        metadata?: AuditMetadata,
    ): Promise<CustomerWithRelations>
    /**
     * Potansiyel müşterileri siler — engel kontrolü, silme ve denetim kayıtları TEK
     * transaction'da (eskiden kontrol ile silme ayrı adımlardı). Engelli kayıt işlemi
     * düşürmez; silinebilenler silinir, engelliler adıyla döner.
     */
    deleteLeadCustomers(ids: readonly string[], audit: AuditContext): Promise<LeadCustomerDeletionPlan>
    replaceAssignedProducts(
        customerId: string,
        productVariantIds: string[],
        createdByUserId: string,
    ): Promise<CustomerAssignedProductWithRelations[]>
    listAssignedProducts(customerId: string): Promise<CustomerAssignedProductWithRelations[]>
    addCustomerFavoriteVariant(
        customerId: string,
        productVariantId: string,
        createdByUserId: string,
    ): Promise<CustomerAssignedProductWithRelations[]>
    removeCustomerFavoriteVariant(
        customerId: string,
        productVariantId: string,
    ): Promise<CustomerAssignedProductWithRelations[]>
    listVisits(customerId: string): Promise<CustomerVisitWithRelations[]>
    createVisit(data: Prisma.CustomerVisitCreateInput): Promise<CustomerVisitWithRelations>
    updateVisit(id: string, data: Prisma.CustomerVisitUpdateInput): Promise<CustomerVisitWithRelations>
    deleteVisit(id: string): Promise<CustomerVisitWithRelations>
    /**
     * Admin/satış müdürü raporu: temsilci/tarih aralığı/il-ilçe/durum filtreli,
     * tüm müşterilere çapraz sayfalı liste. `listVisits`'in aksine tek bir
     * `customerId`'ye kilitli değildir.
     */
    listVisitsForReport(
        query: IPaginationQuery & {
            ownerUserId?: string
            customerStatus?: CustomerStatus
            status?: CustomerVisitStatus
            type?: CustomerVisitType
            outcome?: CustomerVisitOutcome
            scheduledFrom?: Date
            scheduledTo?: Date
            stateId?: number
            cityId?: number
        }
    ): Promise<{
        data: CustomerVisitReportRecord[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    /**
     * Rapor sayfasındaki grafikler için özet sayaçlar — `status` ve `outcome`
     * BİLEREK bu sorgunun kendi filtre alanları DEĞİL: aksi halde "durum
     * dağılımı" grafiği kullanıcı zaten bir duruma göre filtrelediğinde
     * anlamsız tek-çubuğa düşerdi. Diğer tüm filtreler (temsilci/müşteri
     * durumu/tür/tarih aralığı/il-ilçe) aynen uygulanır.
     */
    getVisitsReportSummary(query: {
        ownerUserId?: string
        customerStatus?: CustomerStatus
        type?: CustomerVisitType
        scheduledFrom?: Date
        scheduledTo?: Date
        stateId?: number
        cityId?: number
    }): Promise<{
        total: number
        statusCounts: Record<CustomerVisitStatus, number>
        outcomeCounts: Record<CustomerVisitOutcome, number>
    }>
}

const buildAddressWriteData = (
    data: CustomerAddressMutationInput,
    mode: "create" | "update",
): Prisma.CustomerAddressUncheckedCreateWithoutCustomerInput | Prisma.CustomerAddressUncheckedUpdateInput => {
    const base = {
        label: data.label,
        contactName: data.contactName ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        countryId: data.countryId ?? null,
        stateId: data.stateId ?? null,
        cityId: data.cityId ?? null,
        country: data.country?.trim() || "Turkiye",
        city: data.city,
        district: data.district ?? null,
        line1: data.line1,
        line2: data.line2 ?? null,
        postalCode: data.postalCode ?? null,
        taxOffice: data.taxOffice ?? null,
        taxNumber: data.taxNumber ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        locationSource: data.locationSource ?? null,
        locationAccuracy: data.locationAccuracy ?? null,
        geocodingProvider: data.geocodingProvider ?? null,
        geocodingPlaceId: data.geocodingPlaceId ?? null,
        geocodingLabel: data.geocodingLabel ?? null,
        geocodedAt: data.geocodedAt ?? null,
        geocodingExpiresAt: data.geocodingExpiresAt ?? null,
        locationVerifiedAt: data.locationVerifiedAt ?? null,
        locationVerifiedByUserId: data.locationVerifiedByUserId ?? null,
        isPrimary: Boolean(data.isPrimary),
        isBilling: Boolean(data.isBilling),
        isShipping: data.isShipping ?? true,
        note: data.note ?? null,
    }

    if (mode === "create") {
        return {
            ...base,
            geocodingRaw: data.geocodingRaw ?? Prisma.DbNull,
        }
    }

    return Object.fromEntries(
        Object.entries({
            ...base,
            geocodingRaw: data.geocodingRaw === undefined ? undefined : data.geocodingRaw ?? Prisma.DbNull,
            locationVerifiedByUserId: data.locationVerifiedByUserId === undefined ? undefined : data.locationVerifiedByUserId,
        }).filter(([, value]) => value !== undefined),
    ) as Prisma.CustomerAddressUncheckedUpdateInput
}

const sortAddressesForDisplay = <T extends {
    displayOrder: number
    createdAt: Date
}>(addresses: T[]) => [...addresses].sort((left, right) =>
    left.displayOrder - right.displayOrder || left.createdAt.getTime() - right.createdAt.getTime(),
)

const normalizeAddressOrderingAndFlags = <T extends {
    id: string
    isPrimary: boolean
    isShipping: boolean
    displayOrder: number
    createdAt: Date
}>(addresses: T[]) => {
    const sorted = sortAddressesForDisplay(addresses)
    const hasPrimary = sorted.some((address) => address.isPrimary)
    const hasShipping = sorted.some((address) => address.isShipping)
    const fallbackAddressId = (sorted.find((address) => address.isShipping) ?? sorted[0])?.id ?? null

    return sorted.map((address, index) => ({
        id: address.id,
        displayOrder: index,
        isPrimary: hasPrimary ? address.isPrimary : address.id === fallbackAddressId,
        isShipping: hasShipping ? address.isShipping : address.id === fallbackAddressId,
    }))
}

// Client `$extends`'li olduğu için `Prisma.TransactionClient` uymuyor.
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

/* --------------------------------------------------------------------------
 * DENETİMLİ YAZMA (AuditLog) — Customer'a yazan HER yol buradan geçer.
 *
 * Desen "çevreleyen anlık görüntü": satır kilitlenir, müşterinin denetlenen hâli
 * (müşteri + adresler + telefonlar + profil + iletişim kişileri) okunur, değişiklik
 * yapılır, tekrar okunur ve fark AYNI transaction'da yazılır. Hangi alt tablo
 * değişirse değişsin aynı yol yakalar; uç başına ayrı fark kodu yok.
 * Kurallar: AGENTS.md § "When adding audit logging to a model".
 * ------------------------------------------------------------------------ */

/**
 * Satırları kilitler (id sırasıyla — eşzamanlı iki toplu işlem birbirini kilitlemesin).
 * Kilitsiz okumada eşzamanlı iki güncellemenin ikincisi bayat bir "önce" kaydederdi.
 */
const lockCustomerRows = (tx: TransactionClient, ids: readonly string[]) =>
    tx.$queryRaw`SELECT "id" FROM "Customer" WHERE "id" = ANY(${[...ids]}::text[]) ORDER BY "id" FOR UPDATE`

/** Denetlenen hâli TEK seferde okur: kayıt sayısından bağımsız, ilişki başına bir sorgu. */
async function loadCustomerAuditRows(tx: TransactionClient, ids: readonly string[]) {
    const rows = await tx.customer.findMany({
        where: { id: { in: [...ids] } },
        include: customerAuditInclude,
    })
    return new Map(rows.map((row) => [row.id, row]))
}

function customerAuditEntry(
    action: AuditLogEntry["action"],
    before: CustomerAuditRow | null,
    after: CustomerAuditRow | null,
    context: AuditContext,
    metadata?: AuditMetadata,
): AuditLogEntry | null {
    const subject = after ?? before
    if (!subject) return null

    const changes = diffAuditSnapshots(
        before ? toCustomerAuditSnapshot(before) : null,
        after ? toCustomerAuditSnapshot(after) : null,
    )
    // Denetlenen hiçbir alan değişmediyse kayıt yazılmaz: boş kayıt geçmişi kirletir.
    if (changes.length === 0) return null

    return {
        entityType: "Customer",
        entityId: subject.id,
        entityLabel: customerAuditLabel(subject),
        action,
        changes,
        metadata,
        context,
    }
}

/**
 * Var olan bir müşteriyi değiştiren her işlem: kilitle → önce → `mutate` → sonra → fark.
 * `mutate` YALNIZ `tx` ile yazmalı (global `prisma` transaction dışına kaçar).
 */
async function runAuditedCustomerUpdate<T>(
    tx: TransactionClient,
    customerId: string,
    audit: AuditContext,
    mutate: () => Promise<T>,
    metadata?: AuditMetadata,
): Promise<T> {
    await lockCustomerRows(tx, [customerId])

    const before = (await loadCustomerAuditRows(tx, [customerId])).get(customerId)
    if (!before) throw new createError.NotFound("Customer not found")

    const result = await mutate()

    const after = (await loadCustomerAuditRows(tx, [customerId])).get(customerId) ?? null
    const entry = customerAuditEntry("UPDATE", before, after, audit, metadata)
    if (entry) await writeAuditLog(tx, entry)

    return result
}

async function writeCustomerCreatedAudit(
    tx: TransactionClient,
    customerId: string,
    audit: AuditContext,
    metadata?: AuditMetadata,
) {
    const after = (await loadCustomerAuditRows(tx, [customerId])).get(customerId) ?? null
    const entry = customerAuditEntry("CREATE", null, after, audit, metadata)
    if (entry) await writeAuditLog(tx, entry)
}

async function createAddressInTransaction(
    tx: TransactionClient,
    customerId: string,
    data: CustomerAddressMutationInput,
) {
    const currentMax = await tx.customerAddress.aggregate({
        where: { customerId },
        _max: { displayOrder: true },
    })

    if (data.isPrimary) {
        await tx.customerAddress.updateMany({
            where: { customerId },
            data: { isPrimary: false },
        })
    }

    await tx.customerAddress.create({
        data: {
            customerId,
            ...(buildAddressWriteData(data, "create") as Prisma.CustomerAddressUncheckedCreateWithoutCustomerInput),
            displayOrder: (currentMax._max.displayOrder ?? 0) + 1,
        },
    })
}

/**
 * Zaten açık bir transaction içinden müşteri güncellemesi — iş talebi onayı
 * (`CUSTOMER_PROFILE_CHANGE`) kullanır. Aktör onaylayan; talep bilgisi `metadata`'da.
 */
export async function applyCustomerUpdateInTransaction(
    tx: TransactionClient,
    customerId: string,
    data: Prisma.CustomerUpdateInput,
    audit: AuditContext,
    metadata?: AuditMetadata,
) {
    await runAuditedCustomerUpdate(
        tx,
        customerId,
        audit,
        () => tx.customer.update({ where: { id: customerId }, data, select: { id: true } }),
        metadata,
    )
}

/**
 * Bir satış kullanıcısına atanan müşteri listesini TAM DEĞİŞİM olarak yazar (kullanıcı
 * düzenleme ekranı). Etkilenen her müşteri için `assignedSalesUser` değişikliği tek
 * sorguda kaydedilir; alan adı ve değer biçimi tam snapshot'takiyle aynı, böylece
 * müşterinin geçmişinde diğer kayıtlarla aynı satırda görünür.
 */
export async function replaceSalesUserCustomersInTransaction(
    tx: TransactionClient,
    salesUserId: string,
    customerIds: readonly string[],
    audit: AuditContext,
) {
    const targetIds = [...new Set(customerIds)]

    await tx.$queryRaw`SELECT "id" FROM "Customer" WHERE "assignedSalesUserId" = ${salesUserId} OR "id" = ANY(${targetIds}::text[]) ORDER BY "id" FOR UPDATE`

    const affected = await tx.customer.findMany({
        where: {
            OR: [
                { assignedSalesUserId: salesUserId },
                { id: { in: targetIds } },
            ],
        },
        select: {
            id: true,
            companyName: true,
            fullName: true,
            phone: true,
            assignedSalesUser: { select: { firstName: true, lastName: true, identifier: true, email: true } },
        },
    })
    const salesUser = await tx.user.findUnique({
        where: { id: salesUserId },
        select: { firstName: true, lastName: true, identifier: true, email: true },
    })

    await tx.customer.updateMany({
        where: { assignedSalesUserId: salesUserId },
        data: { assignedSalesUserId: null },
    })
    if (targetIds.length > 0) {
        await tx.customer.updateMany({
            where: { id: { in: targetIds } },
            data: { assignedSalesUserId: salesUserId },
        })
    }

    const targetSet = new Set(targetIds)
    const nextLabel = customerAuditUserLabel(salesUser)
    const entries = affected.flatMap((customer): AuditLogEntry[] => {
        const before = customerAuditUserLabel(customer.assignedSalesUser)
        const after = targetSet.has(customer.id) ? nextLabel : null
        if (before === after) return []

        return [{
            entityType: "Customer",
            entityId: customer.id,
            entityLabel: customerAuditLabel(customer),
            action: "UPDATE",
            changes: [{ field: "assignedSalesUser", before, after }],
            context: audit,
        }]
    })

    await writeAuditLogs(tx, entries)
}

// Müşteri yazmaları birkaç sorgu + iki anlık görüntü okur; Neon gecikmesine pay.
const customerWriteTransactionOptions = addressTransactionOptions


export const customerRepository = (): IPrismaCustomerRepository => {
    const listCustomers = async (
        query: IPaginationQuery & {
            sectorValueId?: string
            productionGroupValueId?: string
            usageAreaValueId?: string
            status?: CustomerStatus
            assignedSalesUserId?: string
            countryId?: number
            stateId?: number
            cityId?: number
        },
    ) => {
        const { where, orderBy, skip, take, page, limit } = buildPaginationQuery<Customer>(query, {
            searchableFields: ["fullName", "companyName", "email", "phone"],
            defaultSort: "createdAt",
        })

        const finalWhere: Prisma.CustomerWhereInput = {
            ...where,
            // Genel arama skaler alanlara bakıyor; ek numaralar ilişki üzerinden eklenir.
            ...(query.search && Array.isArray(where.OR)
                ? { OR: [...where.OR, buildCustomerAdditionalPhoneSearchWhere(query.search)] }
                : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.assignedSalesUserId ? { assignedSalesUserId: query.assignedSalesUserId } : {}),
            ...(query.sectorValueId ? { sectorValueId: query.sectorValueId } : {}),
            ...(query.productionGroupValueId
                ? { productionGroupValueId: query.productionGroupValueId }
                : {}),
            ...(query.usageAreaValueId
                ? {
                    usageAreaValues: {
                        some: {
                            id: query.usageAreaValueId,
                        },
                    },
                }
                : {}),
            ...((query.countryId || query.stateId || query.cityId)
                ? {
                    addresses: {
                        some: {
                            ...(query.countryId ? { countryId: query.countryId } : {}),
                            ...(query.stateId ? { stateId: query.stateId } : {}),
                            ...(query.cityId ? { cityId: query.cityId } : {}),
                        },
                    },
                }
                : {}),
        }

        const data = await prisma.customer.findMany({
            where: finalWhere,
            orderBy,
            skip,
            take,
            include: customerBaseInclude,
        })
        const total = await prisma.customer.count({ where: finalWhere })

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const listCustomersForMap = async (query: {
        north: number
        south: number
        east: number
        west: number
        search?: string
        status?: CustomerStatus
        assignedSalesUserId?: string
        sectorValueId?: string
        usageAreaValueId?: string
        countryId?: number
        stateId?: number
        cityId?: number
    }) => {
        const south = Math.min(query.south, query.north)
        const north = Math.max(query.south, query.north)
        const west = Math.min(query.west, query.east)
        const east = Math.max(query.west, query.east)
        // Adres FK filtresi (ülke/il/ilçe): normalize FK'lar üzerinden, görüntü
        // metinleri değil — indeksli ve metnin yazımından bağımsız. Pinlenecek
        // adres hem viewport'a hem bu filtreye uymalı, o yüzden `coordinateWhere`
        // ile AND'lenir.
        const geoAddressWhere: Prisma.CustomerAddressWhereInput = {
            ...(query.countryId ? { countryId: query.countryId } : {}),
            ...(query.stateId ? { stateId: query.stateId } : {}),
            ...(query.cityId ? { cityId: query.cityId } : {}),
        }
        // Görünür pencere SQL'de daraltılır: aksi halde her pan/zoom koordinatlı
        // TÜM müşterileri ve adreslerini çekip JS'te eler.
        const coordinateWhere: Prisma.CustomerAddressWhereInput = {
            ...geoAddressWhere,
            latitude: { not: null, gte: south, lte: north },
            longitude: { not: null, gte: west, lte: east },
            OR: [
                { geocodingProvider: null },
                { geocodingProvider: { not: GOOGLE_PLACES_PROVIDER } },
                {
                    geocodingProvider: GOOGLE_PLACES_PROVIDER,
                    geocodingExpiresAt: { gt: new Date() },
                },
            ],
        }
        const search = query.search?.trim()

        const customers = await prisma.customer.findMany({
            where: {
                ...(query.status ? { status: query.status } : {}),
                ...(query.assignedSalesUserId ? { assignedSalesUserId: query.assignedSalesUserId } : {}),
                ...(query.sectorValueId ? { sectorValueId: query.sectorValueId } : {}),
                ...(query.usageAreaValueId
                    ? { usageAreaValues: { some: { id: query.usageAreaValueId } } }
                    : {}),
                ...(search
                    ? {
                        OR: [
                            { fullName: { contains: search, mode: "insensitive" } },
                            { companyName: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } },
                            { phone: { contains: search, mode: "insensitive" } },
                            buildCustomerAdditionalPhoneSearchWhere(search),
                        ],
                    }
                    : {}),
                addresses: {
                    some: coordinateWhere,
                },
            },
            orderBy: [
                { companyName: "asc" },
                { fullName: "asc" },
            ],
            take: MAP_CUSTOMER_LIMIT,
            select: {
                id: true,
                companyName: true,
                fullName: true,
                email: true,
                phone: true,
                status: true,
                assignedSalesUserId: true,
                addresses: {
                    where: coordinateWhere,
                    orderBy: [
                        { displayOrder: "asc" },
                        { createdAt: "asc" },
                    ],
                    select: {
                        id: true,
                        label: true,
                        line1: true,
                        district: true,
                        city: true,
                        country: true,
                        latitude: true,
                        longitude: true,
                        isPrimary: true,
                        isShipping: true,
                        geocodingProvider: true,
                        geocodingPlaceId: true,
                    },
                },
            },
        })

        return customers.flatMap((customer) => {
            // Adresler sorguda zaten pencereye göre süzüldü; buradaki seçim
            // görünürdeki adresler arasında yapılır.
            const address = customer.addresses.find((item) => item.isPrimary && item.isShipping)
                ?? customer.addresses.find((item) => item.isPrimary)
                ?? customer.addresses[0]
            const latitude = decimalLikeToNumber(address?.latitude)
            const longitude = decimalLikeToNumber(address?.longitude)

            if (!address || latitude === undefined || longitude === undefined) {
                return []
            }

            return [{
                customerId: customer.id,
                companyName: customer.companyName,
                fullName: customer.fullName,
                email: customer.email,
                phone: customer.phone,
                status: customer.status,
                assignedSalesUserId: customer.assignedSalesUserId,
                addressId: address.id,
                addressLabel: address.label,
                addressSummary: buildCustomerAddressSummary(address),
                latitude,
                longitude,
                isPrimary: address.isPrimary,
                isShipping: address.isShipping,
                geocodingProvider: address.geocodingProvider ?? null,
                geocodingPlaceId: address.geocodingPlaceId ?? null,
            }]
        })
    }

    const getCustomer = async (id: string) =>
        prisma.customer.findUnique({
            where: { id },
            include: customerDetailInclude,
        })

    const getCustomerOrThrow = async (id: string) =>
        prisma.customer.findUniqueOrThrow({
            where: { id },
            include: customerDetailInclude,
        })

    const getCustomerPricingContext = async (id: string) =>
        prisma.customer.findUnique({
            where: { id },
            select: { generalDiscountPercent: true },
        })

    const getCustomerPortalOverview = async (id: string) =>
        prisma.customer.findUnique({
            where: { id },
            include: customerPortalOverviewInclude,
        })

    // Geniş include'lu dönüş okuması transaction DIŞINDA (commit'ten sonra) yapılır.
    const getCustomerWithRelationsOrThrow = (id: string) =>
        prisma.customer.findUniqueOrThrow({
            where: { id },
            include: customerBaseInclude,
        })

    const createCustomer = async (
        data: Prisma.CustomerCreateInput,
        audit: AuditContext,
        options?: { address?: CustomerAddressMutationInput | null },
    ) => {
        const customerId = await prisma.$transaction(async (tx) => {
            const created = await tx.customer.create({ data, select: { id: true } })

            if (options?.address) {
                await createAddressInTransaction(tx, created.id, options.address)
            }

            await writeCustomerCreatedAudit(tx, created.id, audit)
            return created.id
        }, customerWriteTransactionOptions)

        return getCustomerWithRelationsOrThrow(customerId)
    }

    const updateCustomer = async (
        id: string,
        data: Prisma.CustomerUpdateInput,
        audit: AuditContext,
        options?: {
            companyContactAssignments?: Array<{
                companyContactId: string
                isActive?: boolean
                displayOrder?: number
                note?: string | null
            }>
            replaceAttributeAssignmentCodes?: string[]
        },
    ) => {
        await prisma.$transaction((tx) => runAuditedCustomerUpdate(tx, id, audit, async () => {
            if (options?.replaceAttributeAssignmentCodes?.length) {
                await tx.customerAttributeValueAssignment.deleteMany({
                    where: {
                        customerId: id,
                        attributeValue: {
                            attribute: { code: { in: options.replaceAttributeAssignmentCodes } },
                        },
                    },
                })
            }

            await tx.customer.update({ where: { id }, data, select: { id: true } })

            if (options?.companyContactAssignments !== undefined) {
                const uniqueAssignments = normalizeCompanyContactAssignments(options.companyContactAssignments)

                await tx.customerCompanyContactAssignment.deleteMany({
                    where: { customerId: id },
                })

                if (uniqueAssignments.length > 0) {
                    await tx.customerCompanyContactAssignment.createMany({
                        data: uniqueAssignments.map((assignment) => ({
                            customerId: id,
                            ...assignment,
                        })),
                    })
                }
            }
        }), customerWriteTransactionOptions)

        return getCustomerWithRelationsOrThrow(id)
    }

    const createAddress = async (
        customerId: string,
        data: CustomerAddressMutationInput,
        audit: AuditContext,
    ) => {
        await prisma.$transaction(
            (tx) => runAuditedCustomerUpdate(tx, customerId, audit, () => createAddressInTransaction(tx, customerId, data)),
            customerWriteTransactionOptions,
        )

        // Geniş müşteri detay sorgusu transaction süresine ve commit'e dahil
        // edilmemeli; commit tamamlandıktan sonra güncel kaydı okuyoruz.
        return getCustomerOrThrow(customerId)
    }

    const getAddress = async (customerId: string, addressId: string) =>
        prisma.customerAddress.findFirst({
            where: {
                id: addressId,
                customerId,
            },
            include: customerDetailInclude.addresses.include,
        })

    const updateAddress = async (
        customerId: string,
        addressId: string,
        data: CustomerAddressMutationInput,
        audit: AuditContext,
    ) => {
        await prisma.$transaction((tx) => runAuditedCustomerUpdate(tx, customerId, audit, async () => {
            const existing = await tx.customerAddress.findFirst({
                where: {
                    id: addressId,
                    customerId,
                },
                select: {
                    id: true,
                },
            })

            if (!existing) {
                throw new Error("Customer address not found")
            }

            if (data.isPrimary) {
                await tx.customerAddress.updateMany({
                    where: {
                        customerId,
                        NOT: {
                            id: addressId,
                        },
                    },
                    data: { isPrimary: false },
                })
            }

            await tx.customerAddress.update({
                where: { id: existing.id },
                data: buildAddressWriteData(data, "update") as Prisma.CustomerAddressUncheckedUpdateInput,
            })
        }), customerWriteTransactionOptions)

        return getCustomerOrThrow(customerId)
    }

    const deleteAddress = async (customerId: string, addressId: string, audit: AuditContext) => {
        await prisma.$transaction((tx) => runAuditedCustomerUpdate(tx, customerId, audit, async () => {
            const existing = await tx.customerAddress.findFirst({
                where: {
                    id: addressId,
                    customerId,
                },
                select: {
                    id: true,
                },
            })

            if (!existing) {
                throw new Error("Customer address not found")
            }

            await tx.customerAddress.delete({
                where: { id: existing.id },
            })

            const remainingAddresses = await tx.customerAddress.findMany({
                where: { customerId },
                select: {
                    id: true,
                    isPrimary: true,
                    isShipping: true,
                    displayOrder: true,
                    createdAt: true,
                },
            })

            const normalizedAddresses = normalizeAddressOrderingAndFlags(remainingAddresses)

            for (const address of normalizedAddresses) {
                await tx.customerAddress.update({
                    where: { id: address.id },
                    data: {
                        displayOrder: address.displayOrder,
                        isPrimary: address.isPrimary,
                        isShipping: address.isShipping,
                    },
                })
            }
        }), customerWriteTransactionOptions)

        return getCustomerOrThrow(customerId)
    }

    const convertCustomer = async (
        id: string,
        convertedByUserId: string,
        audit: AuditContext,
        metadata?: AuditMetadata,
    ) => {
        await prisma.$transaction((tx) => runAuditedCustomerUpdate(tx, id, audit, () =>
            tx.customer.update({
                where: { id },
                data: {
                    status: CustomerStatus.CUSTOMER,
                    convertedAt: new Date(),
                    convertedByUser: {
                        connect: { id: convertedByUserId },
                    },
                },
                select: { id: true },
            }), metadata), customerWriteTransactionOptions)

        return getCustomerWithRelationsOrThrow(id)
    }

    const deleteLeadCustomers = async (ids: readonly string[], audit: AuditContext) => {
        const uniqueIds = [...new Set(ids)]
        if (uniqueIds.length === 0) return { deletableIds: [], blocked: [] }

        return prisma.$transaction(async (tx) => {
            await lockCustomerRows(tx, uniqueIds)

            const rows = await tx.customer.findMany({
                where: { id: { in: uniqueIds } },
                select: {
                    id: true,
                    status: true,
                    fullName: true,
                    companyName: true,
                    _count: {
                        select: {
                            ...LEAD_CUSTOMER_DELETION_COUNT_SELECT,
                            visits: true,
                            assignedProducts: true,
                            specialVariantPrices: true,
                        },
                    },
                },
            })

            // Bulunamayan id sessizce yutulmaz: çağıran neyin işlenmediğini görmeli.
            if (rows.length !== uniqueIds.length) {
                const found = new Set(rows.map((row) => row.id))
                const missing = uniqueIds.filter((id) => !found.has(id))
                throw new createError.NotFound(`Kayıt bulunamadı: ${missing.length} adet`)
            }

            const plan = planLeadCustomerDeletion(
                rows.map((row) => ({
                    id: row.id,
                    name: row.companyName || row.fullName || row.id,
                    isLead: row.status === CustomerStatus.LEAD,
                    counts: {
                        orders: row._count.orders,
                        portalUsers: row._count.portalUsers,
                        businessRequests: row._count.businessRequests,
                    },
                })),
            )

            if (plan.deletableIds.length > 0) {
                const before = await loadCustomerAuditRows(tx, plan.deletableIds)
                const countsById = new Map(rows.map((row) => [row.id, row._count]))

                // Cascade ilişkiler (adres, nitelik ataması, ziyaret…) DB tarafında birlikte gider.
                await tx.customer.deleteMany({ where: { id: { in: plan.deletableIds } } })

                await writeAuditLogs(tx, plan.deletableIds.flatMap((id): AuditLogEntry[] => {
                    const counts = countsById.get(id)
                    const entry = customerAuditEntry("DELETE", before.get(id) ?? null, null, audit, {
                        // Silmeyle giden ilişkiler başka hiçbir yerde kalmaz.
                        cascade: {
                            visitCount: counts?.visits ?? 0,
                            assignedProductCount: counts?.assignedProducts ?? 0,
                            specialPriceCount: counts?.specialVariantPrices ?? 0,
                        },
                    })
                    return entry ? [entry] : []
                }))
            }

            return plan
        }, customerWriteTransactionOptions)
    }

    const listAssignedProducts = async (customerId: string) =>
        prisma.customerAssignedProduct.findMany({
            where: { customerId },
            orderBy: [
                // Temsilci ataması önce, müşterinin kendi favorileri sonra;
                // aynı kaynak içinde displayOrder korunur.
                { source: "asc" },
                { displayOrder: "asc" },
            ],
            include: customerAssignedProductVariantInclude,
        })

    const replaceAssignedProducts = async (
        customerId: string,
        productVariantIds: string[],
        createdByUserId: string,
    ) => {
        const uniqueProductVariantIds = Array.from(new Set(productVariantIds.filter(Boolean)))

        await prisma.$transaction(async (tx) => {
            // KAYNAK İZOLASYONU (kritik): silme YALNIZ temsilci atamalarını kapsar.
            // Kapsam daraltılmazsa temsilcinin listeyi kaydetmesi, müşterinin kalple
            // eklediği favorileri de siler.
            await tx.customerAssignedProduct.deleteMany({
                where: { customerId, source: CustomerAssignedProductSource.STAFF },
            })

            if (uniqueProductVariantIds.length > 0) {
                await tx.customerAssignedProduct.createMany({
                    data: uniqueProductVariantIds.map((productVariantId, index) => ({
                        customerId,
                        productVariantId,
                        displayOrder: index,
                        source: CustomerAssignedProductSource.STAFF,
                        createdByUserId,
                    })),
                })
            }
        })

        return listAssignedProducts(customerId)
    }

    /**
     * Müşterinin kendi kalp işareti. `source: CUSTOMER` satırlarına dokunur;
     * temsilci ataması (STAFF) aynı varyant için ayrı satırda durmaya devam eder.
     *
     * Zaten favorideyse yeni satır üretmez — kalp butonu çift tıklamaya ve
     * eşzamanlı isteklere karşı bu sayede dayanıklıdır (unique kısıt da korur).
     */
    const addCustomerFavoriteVariant = async (
        customerId: string,
        productVariantId: string,
        createdByUserId: string,
    ) => {
        const lastFavorite = await prisma.customerAssignedProduct.findFirst({
            where: { customerId, source: CustomerAssignedProductSource.CUSTOMER },
            orderBy: { displayOrder: "desc" },
            select: { displayOrder: true },
        })

        await prisma.customerAssignedProduct.upsert({
            where: {
                customerId_productVariantId_source: {
                    customerId,
                    productVariantId,
                    source: CustomerAssignedProductSource.CUSTOMER,
                },
            },
            create: {
                customerId,
                productVariantId,
                source: CustomerAssignedProductSource.CUSTOMER,
                displayOrder: (lastFavorite?.displayOrder ?? -1) + 1,
                createdByUserId,
            },
            // Var olan favori yeniden eklenirse sahiplik/sıra değişmemeli.
            update: {},
        })

        return listAssignedProducts(customerId)
    }

    const removeCustomerFavoriteVariant = async (
        customerId: string,
        productVariantId: string,
    ) => {
        await prisma.customerAssignedProduct.deleteMany({
            where: {
                customerId,
                productVariantId,
                source: CustomerAssignedProductSource.CUSTOMER,
            },
        })

        return listAssignedProducts(customerId)
    }

    const listVisits = async (customerId: string) =>
        prisma.customerVisit.findMany({
            where: { customerId },
            orderBy: [
                { scheduledAt: "desc" },
                { createdAt: "desc" },
            ],
            include: customerDetailInclude.visits.include,
        })

    const createVisit = async (data: Prisma.CustomerVisitCreateInput) =>
        prisma.customerVisit.create({
            data,
            include: customerDetailInclude.visits.include,
        })

    const updateVisit = async (id: string, data: Prisma.CustomerVisitUpdateInput) =>
        prisma.customerVisit.update({
            where: { id },
            data,
            include: customerDetailInclude.visits.include,
        })

    const deleteVisit = async (id: string) =>
        prisma.customerVisit.delete({
            where: { id },
            include: customerDetailInclude.visits.include,
        })

    /**
     * `listVisitsForReport` ve `getVisitsReportSummary` arasında paylaşılan
     * filtre alanları — özet sorgusu BİLEREK `status`/`outcome` almaz (bkz.
     * arayüz yorumu), o yüzden bu tip ikisinin KESİŞİMİ.
     */
    const buildVisitsReportBaseWhere = (query: {
        ownerUserId?: string
        customerStatus?: CustomerStatus
        type?: CustomerVisitType
        scheduledFrom?: Date
        scheduledTo?: Date
        stateId?: number
        cityId?: number
    }): Prisma.CustomerVisitWhereInput => ({
        ...(query.ownerUserId ? { ownerUserId: query.ownerUserId } : {}),
        ...(query.customerStatus ? { customer: { status: query.customerStatus } } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...((query.scheduledFrom || query.scheduledTo)
            ? {
                scheduledAt: {
                    ...(query.scheduledFrom ? { gte: query.scheduledFrom } : {}),
                    ...(query.scheduledTo ? { lte: query.scheduledTo } : {}),
                },
            }
            : {}),
        ...((query.stateId || query.cityId)
            ? {
                address: {
                    ...(query.stateId ? { stateId: query.stateId } : {}),
                    ...(query.cityId ? { cityId: query.cityId } : {}),
                },
            }
            : {}),
    })

    const listVisitsForReport = async (
        query: IPaginationQuery & {
            ownerUserId?: string
            customerStatus?: CustomerStatus
            status?: CustomerVisitStatus
            type?: CustomerVisitType
            outcome?: CustomerVisitOutcome
            scheduledFrom?: Date
            scheduledTo?: Date
            stateId?: number
            cityId?: number
        },
    ) => {
        const { skip, take, page, limit } = buildPaginationQuery<Prisma.CustomerVisitWhereInput>(query)

        const finalWhere: Prisma.CustomerVisitWhereInput = {
            ...buildVisitsReportBaseWhere(query),
            ...(query.status ? { status: query.status } : {}),
            ...(query.outcome ? { outcome: query.outcome } : {}),
        }

        const data = await prisma.customerVisit.findMany({
            where: finalWhere,
            orderBy: [
                { scheduledAt: "desc" },
                { createdAt: "desc" },
            ],
            skip,
            take,
            include: customerVisitReportInclude,
        })
        const total = await prisma.customerVisit.count({ where: finalWhere })

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getVisitsReportSummary = async (query: {
        ownerUserId?: string
        customerStatus?: CustomerStatus
        type?: CustomerVisitType
        scheduledFrom?: Date
        scheduledTo?: Date
        stateId?: number
        cityId?: number
    }) => {
        const baseWhere = buildVisitsReportBaseWhere(query)

        const [statusGroups, outcomeGroups] = await Promise.all([
            prisma.customerVisit.groupBy({
                by: ["status"],
                where: baseWhere,
                _count: { _all: true },
            }),
            prisma.customerVisit.groupBy({
                by: ["outcome"],
                where: { ...baseWhere, outcome: { not: null } },
                _count: { _all: true },
            }),
        ])

        const statusCounts = Object.fromEntries(
            Object.values(CustomerVisitStatus).map((status) => [status, 0]),
        ) as Record<CustomerVisitStatus, number>
        for (const group of statusGroups) statusCounts[group.status] = group._count._all

        const outcomeCounts = Object.fromEntries(
            Object.values(CustomerVisitOutcome).map((outcome) => [outcome, 0]),
        ) as Record<CustomerVisitOutcome, number>
        for (const group of outcomeGroups) {
            if (group.outcome) outcomeCounts[group.outcome] = group._count._all
        }

        const total = statusGroups.reduce((sum, group) => sum + group._count._all, 0)

        return { total, statusCounts, outcomeCounts }
    }

    return {
        listCustomers,
        listCustomersForMap,
        getCustomer,
        getCustomerPricingContext,
        getCustomerPortalOverview,
        createCustomer,
        updateCustomer,
        createAddress,
        getAddress,
        updateAddress,
        deleteAddress,
        convertCustomer,
        deleteLeadCustomers,
        replaceAssignedProducts,
        listAssignedProducts,
        addCustomerFavoriteVariant,
        removeCustomerFavoriteVariant,
        listVisits,
        createVisit,
        updateVisit,
        deleteVisit,
        listVisitsForReport,
        getVisitsReportSummary,
    }
}

export { CustomerStatus, CustomerVisitStatus }
