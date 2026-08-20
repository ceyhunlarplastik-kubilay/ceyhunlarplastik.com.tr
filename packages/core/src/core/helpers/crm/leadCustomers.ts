import createError from "http-errors"

import { prisma } from "@/core/db/prisma"
import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import {
    prepareCustomerAddressInput,
    type CustomerAddressBody,
} from "@/core/helpers/crm/customerAddressInput"
import { CUSTOMER_ATTRIBUTE_CODES, resolveCustomerAttributeAssignments } from "@/core/helpers/crm/customerAttributes"
import { normalizeWebsiteUrl } from "@/core/helpers/crm/customerWebsite"
import {
    buildCustomerProfileProductWhereClauses,
    resolveCustomerProfileHierarchy,
} from "@/core/helpers/crm/customerProfileMatching"
import { mapCustomerAddressForApi } from "@/core/helpers/crm/mapCustomerForApi"
import type { IPrismaCustomerRepository } from "@/core/helpers/prisma/customers/repository"
import type { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { AssetRole, Prisma } from "@/prisma/generated/prisma/client"

/**
 * Veri girişi panelinin POTANSİYEL MÜŞTERİ yüzeyi.
 *
 * Neden `/customers` uçları kullanılmıyor: o uçlar iskonto, kredi limiti, vade,
 * satış temsilcisi ataması ve LEAD↔CUSTOMER dönüşümü kabul ediyor ve
 * `admin`+`owner` ile sınırlı. İçerik editörünün işi yalnız kimlik + endüstriyel
 * profil girmek; bu modülün yüzeyi ticari alanları HİÇ tanımaz, dolayısıyla
 * yazılamaz.
 *
 * İkinci sert kural: buradaki her yazma yolu yalnız `status: LEAD` kayıtlara
 * dokunur. Cari müşteriye dönmüş bir kaydın profili buradan değiştirilemez.
 */

/** Önizlemede gösterilecek en fazla ürün. Sayının tamamı ayrıca döner. */
export const LEAD_CUSTOMER_MATCH_PREVIEW_LIMIT = 12

export type LeadCustomerAttributeValue = {
    id: string
    name: string
    slug: string
    parentValueId: string | null
}

export type LeadCustomerSummary = {
    id: string
    companyName: string | null
    websiteUrl: string | null
    /** Yetkili adı opsiyonel: veri girişinde firma kaydedilir, kişi sonra öğrenilir. */
    fullName: string | null
    phone: string
    email: string
    note: string | null
    sectorValue: LeadCustomerAttributeValue | null
    productionGroupValue: LeadCustomerAttributeValue | null
    usageAreaValues: LeadCustomerAttributeValue[]
    createdAt: Date
    updatedAt: Date
}

export type LeadCustomerMatchedProduct = {
    id: string
    code: string
    name: string
    slug: string
    categoryName: string | null
    primaryImageUrl: string | null
    matchedLabels: string[]
}

export type LeadCustomerDetail = LeadCustomerSummary & {
    matchedProductCount: number
    matchedProducts: LeadCustomerMatchedProduct[]
    addresses: LeadCustomerAddress[]
}

export type LeadCustomerProfileInput = {
    /** Bu yüzeyde FİRMA kaydedilir; firma adı zorunludur. */
    companyName: string
    /** Ham metin gelir; `normalizeWebsiteUrl` kanonik biçime indirir. */
    websiteUrl?: string | null
    /** Yetkili adı sonradan öğrenilebilir. */
    fullName?: string | null
    phone: string
    email?: string | null
    note?: string | null
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    usageAreaValueIds?: string[]
}

const attributeValueSelect = {
    id: true,
    name: true,
    slug: true,
    parentValueId: true,
} as const

const geoRefSelect = { id: true, name: true } as const

/**
 * Adres DTO'su frontend'in `toAddressDraftValues` beklentisiyle aynı şekle sahip
 * (`stateRef.name` gibi) — böylece paylaşılan `CustomerAddressFormDialog`
 * dönüştürme olmadan doldurulabiliyor.
 */
const leadCustomerAddressSelect = {
    id: true,
    customerId: true,
    label: true,
    contactName: true,
    phone: true,
    email: true,
    countryId: true,
    stateId: true,
    cityId: true,
    country: true,
    city: true,
    district: true,
    line1: true,
    line2: true,
    postalCode: true,
    taxOffice: true,
    taxNumber: true,
    latitude: true,
    longitude: true,
    locationSource: true,
    locationAccuracy: true,
    geocodingProvider: true,
    geocodingPlaceId: true,
    geocodingLabel: true,
    geocodedAt: true,
    geocodingExpiresAt: true,
    locationVerifiedAt: true,
    isPrimary: true,
    isBilling: true,
    isShipping: true,
    note: true,
    displayOrder: true,
    createdAt: true,
    updatedAt: true,
    countryRef: { select: { id: true, name: true, iso2: true } },
    stateRef: { select: geoRefSelect },
    cityRef: { select: geoRefSelect },
} satisfies Prisma.CustomerAddressSelect

type LeadCustomerAddressRecord = Prisma.CustomerAddressGetPayload<{
    select: typeof leadCustomerAddressSelect
}>

export type LeadCustomerAddress = Omit<LeadCustomerAddressRecord, "latitude" | "longitude"> & {
    latitude: number | null
    longitude: number | null
}

const leadCustomerSelect = {
    id: true,
    companyName: true,
    websiteUrl: true,
    fullName: true,
    phone: true,
    email: true,
    note: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    sectorValue: { select: attributeValueSelect },
    productionGroupValue: { select: attributeValueSelect },
    usageAreaValues: {
        select: attributeValueSelect,
        orderBy: { displayOrder: "asc" },
    },
} satisfies Prisma.CustomerSelect

type LeadCustomerRow = Prisma.CustomerGetPayload<{ select: typeof leadCustomerSelect }>

function mapLeadCustomer(customer: LeadCustomerRow): LeadCustomerSummary {
    return {
        id: customer.id,
        companyName: customer.companyName,
        websiteUrl: customer.websiteUrl,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        note: customer.note,
        sectorValue: customer.sectorValue,
        productionGroupValue: customer.productionGroupValue,
        usageAreaValues: customer.usageAreaValues,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
    }
}

function buildSearchWhere(search?: string): Prisma.CustomerWhereInput {
    const normalized = search?.trim()
    if (!normalized) return {}

    return {
        OR: [
            { companyName: { contains: normalized, mode: "insensitive" } },
            { fullName: { contains: normalized, mode: "insensitive" } },
            { email: { contains: normalized, mode: "insensitive" } },
            { phone: { contains: normalized, mode: "insensitive" } },
        ],
    }
}

export async function listLeadCustomers({
    page,
    limit,
    search,
    sectorValueId,
    usageAreaValueId,
}: {
    page: number
    limit: number
    search?: string
    sectorValueId?: string
    usageAreaValueId?: string
}) {
    const safePage = Math.max(1, page)
    const safeLimit = Math.min(Math.max(1, limit), 100)

    const where: Prisma.CustomerWhereInput = {
        status: "LEAD",
        ...buildSearchWhere(search),
        ...(sectorValueId && { sectorValueId }),
        ...(usageAreaValueId && {
            usageAreaValues: { some: { id: usageAreaValueId } },
        }),
    }

    const [data, total] = await Promise.all([
        prisma.customer.findMany({
            where,
            select: leadCustomerSelect,
            orderBy: { createdAt: "desc" },
            skip: (safePage - 1) * safeLimit,
            take: safeLimit,
        }),
        prisma.customer.count({ where }),
    ])

    return {
        data: data.map(mapLeadCustomer),
        meta: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        },
    }
}

/** Yalnız LEAD kayıtları döndürür; cari müşteri bu yüzeyden görünmez. */
async function getLeadCustomerRowOrThrow(id: string) {
    const customer = await prisma.customer.findUnique({
        where: { id },
        select: leadCustomerSelect,
    })

    if (!customer) {
        throw new createError.NotFound("Potansiyel müşteri bulunamadı")
    }

    if (customer.status !== "LEAD") {
        throw new createError.Conflict(
            "Bu kayıt cari müşteriye dönüştürülmüş; profili veri girişi panelinden değiştirilemez.",
        )
    }

    return customer
}

/**
 * Profil eşleşmesinin ÖNİZLEMESİ — eşleşme kuralları
 * `buildCustomerProfileProductWhereClauses` ile ortak, ama `select` incedir.
 * `getCustomerFeaturedAndMatchedProducts` ürün başına 3 seviyeli taksonomi
 * zinciri taşıyor; bu ekran için o ağırlık gereksiz (ve 6MB sınıfı risk).
 */
async function getMatchedProductPreview(customerId: string) {
    const profile = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
            sectorValueId: true,
            productionGroupValueId: true,
            usageAreaValues: { select: { id: true } },
            attributeValueAssignments: {
                select: {
                    attributeValueId: true,
                    attributeValue: {
                        select: { attribute: { select: { code: true } } },
                    },
                },
            },
        },
    })

    if (!profile) return { matchedProductCount: 0, matchedProducts: [] }

    const hierarchy = resolveCustomerProfileHierarchy(profile)
    const whereClauses = buildCustomerProfileProductWhereClauses(hierarchy)

    if (whereClauses.length === 0) {
        return { matchedProductCount: 0, matchedProducts: [] }
    }

    const where: Prisma.ProductWhereInput = { OR: whereClauses }

    const [matchedProductCount, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            orderBy: { code: "asc" },
            take: LEAD_CUSTOMER_MATCH_PREVIEW_LIMIT,
            select: {
                id: true,
                code: true,
                name: true,
                slug: true,
                category: { select: { name: true } },
                assets: { select: { key: true, role: true, type: true } },
                industrialUsages: {
                    where: {
                        usageAreaValueId: { in: hierarchy.usageAreaValueIds },
                    },
                    select: {
                        usageAreaValue: { select: { name: true } },
                    },
                    take: 5,
                },
            },
        }),
    ])

    const matchedProducts: LeadCustomerMatchedProduct[] = products.map((product) => {
        const primaryAsset =
            product.assets.find((asset) => asset.role === AssetRole.PRIMARY && asset.type === "IMAGE") ??
            product.assets.find((asset) => asset.type === "IMAGE")

        const matchedLabels = Array.from(
            new Set(
                product.industrialUsages
                    .map((usage) => usage.usageAreaValue?.name)
                    .filter((name): name is string => Boolean(name)),
            ),
        )

        return {
            id: product.id,
            code: product.code,
            name: product.name,
            slug: product.slug,
            categoryName: product.category?.name ?? null,
            primaryImageUrl: primaryAsset ? buildAssetUrl(primaryAsset.key) : null,
            matchedLabels,
        }
    })

    return { matchedProductCount, matchedProducts }
}

async function listLeadCustomerAddresses(customerId: string) {
    const addresses = await prisma.customerAddress.findMany({
        where: { customerId },
        select: leadCustomerAddressSelect,
        orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
    })

    return addresses.map((address) => mapCustomerAddressForApi(address) as LeadCustomerAddress)
}

/** Detay yanıtının TEK üreticisi — dört uç da aynı gövdeyi döndürür. */
async function buildLeadCustomerDetail(id: string): Promise<LeadCustomerDetail> {
    const customer = await prisma.customer.findUniqueOrThrow({
        where: { id },
        select: leadCustomerSelect,
    })

    const [preview, addresses] = await Promise.all([
        getMatchedProductPreview(id),
        listLeadCustomerAddresses(id),
    ])

    return { ...mapLeadCustomer(customer), ...preview, addresses }
}

export async function getLeadCustomer(id: string): Promise<LeadCustomerDetail> {
    await getLeadCustomerRowOrThrow(id)
    return buildLeadCustomerDetail(id)
}

function normalizeText(value: string | null | undefined) {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

/**
 * Hiyerarşi doğrulaması `resolveCustomerAttributeAssignments`e devredilir:
 * tek sektör, tek üretim grubu, kullanım alanları seçili grubun/sektörün altında
 * olmak zorunda. Kural bu modülde TEKRARLANMAZ.
 */
async function resolveProfileAssignments(
    productAttributeValueRepository: IPrismaProductAttributeValueRepository,
    input: LeadCustomerProfileInput,
) {
    return resolveCustomerAttributeAssignments(productAttributeValueRepository, {
        sectorValueId: input.sectorValueId ?? null,
        productionGroupValueId: input.productionGroupValueId ?? null,
        usageAreaValueIds: input.usageAreaValueIds ?? [],
    })
}

export async function createLeadCustomer({
    productAttributeValueRepository,
    customerRepository,
    input,
    address,
    verifiedByUserId,
}: {
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
    /** Adres yazımı için; yalnız `address` verildiğinde kullanılır. */
    customerRepository?: IPrismaCustomerRepository
    input: LeadCustomerProfileInput
    /**
     * Oluşturma dialogunda adres de girildiyse aynı istekte yazılır. Ayrı adres
     * uçları (create/update/delete) sonradan düzenleme için duruyor.
     */
    address?: CustomerAddressBody | null
    verifiedByUserId?: string | null
}): Promise<LeadCustomerDetail> {
    const resolved = await resolveProfileAssignments(productAttributeValueRepository, input)
    // Adres normalizasyonu müşteri yazılmadan ÖNCE yapılır: geçersiz adres
    // yüzünden yarım kayıt (müşteri var, adres yok) oluşmasın.
    const normalizedAddress = address
        ? await prepareCustomerAddressInput(address, {
            defaultLocationSource: "MANUAL_PIN",
            verifiedByUserId,
            allowVerification: true,
        })
        : null

    const customer = await prisma.customer.create({
        data: {
            companyName: input.companyName.trim(),
            websiteUrl: normalizeWebsiteUrl(input.websiteUrl),
            fullName: normalizeText(input.fullName),
            phone: input.phone.trim(),
            // Customer.email mevcut şemada non-null; bu dar yüzeyde e-posta
            // opsiyonel olduğunda boş dizeyle temsil edilir.
            email: input.email?.trim() ?? "",
            note: normalizeText(input.note),
            // Bu yüzey yalnız potansiyel müşteri üretir; dönüşüm ticari bir karar
            // ve /admin · /satis panellerinde kalır.
            status: "LEAD",
            ...(resolved?.sectorValueId && {
                sectorValue: { connect: { id: resolved.sectorValueId } },
            }),
            ...(resolved?.productionGroupValueId && {
                productionGroupValue: { connect: { id: resolved.productionGroupValueId } },
            }),
            ...(resolved && {
                usageAreaValues: {
                    connect: resolved.usageAreaIds.map((id) => ({ id })),
                },
                attributeValueAssignments: {
                    create: resolved.assignmentValueIds.map((valueId) => ({
                        source: resolved.source,
                        attributeValue: { connect: { id: valueId } },
                    })),
                },
            }),
        },
        select: leadCustomerSelect,
    })

    // Adres ayrı yazılır: repository kendi yazma biçimini üretiyor ve sıra
    // (displayOrder) ile birincil-adres tekilliğini kendi transaction'ında
    // yönetiyor. Geçersiz adres yukarıda normalize aşamasında elendiği için
    // burada kalan tek risk DB hatası — o durumda müşteri kaydı korunur ve
    // adres detay panelinden eklenebilir.
    if (normalizedAddress && customerRepository) {
        await customerRepository.createAddress(customer.id, normalizedAddress)
    }

    return buildLeadCustomerDetail(customer.id)
}

export async function updateLeadCustomer({
    productAttributeValueRepository,
    id,
    input,
}: {
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
    id: string
    input: LeadCustomerProfileInput
}): Promise<LeadCustomerDetail> {
    await getLeadCustomerRowOrThrow(id)

    const resolved = await resolveProfileAssignments(productAttributeValueRepository, input)

    // Hiyerarşi atamaları TAM DEĞİŞİM: eski sector/production_group/usage_area
    // satırları silinip yenileri yazılır. Hiyerarşi dışındaki müşteri
    // attribute'larına (varsa) dokunulmaz — onlar bu yüzeyin işi değil.
    const hierarchyCodes = [
        CUSTOMER_ATTRIBUTE_CODES.sector,
        CUSTOMER_ATTRIBUTE_CODES.productionGroup,
        CUSTOMER_ATTRIBUTE_CODES.usageArea,
    ]

    await prisma.$transaction(async (tx) => {
        await tx.customerAttributeValueAssignment.deleteMany({
            where: {
                customerId: id,
                attributeValue: {
                    attribute: { code: { in: hierarchyCodes } },
                },
            },
        })

        await tx.customer.update({
            where: { id },
            data: {
                companyName: input.companyName.trim(),
                websiteUrl: normalizeWebsiteUrl(input.websiteUrl),
                fullName: normalizeText(input.fullName),
                phone: input.phone.trim(),
                email: input.email?.trim() ?? "",
                note: normalizeText(input.note),
                sectorValue: resolved?.sectorValueId
                    ? { connect: { id: resolved.sectorValueId } }
                    : { disconnect: true },
                productionGroupValue: resolved?.productionGroupValueId
                    ? { connect: { id: resolved.productionGroupValueId } }
                    : { disconnect: true },
                usageAreaValues: {
                    set: (resolved?.usageAreaIds ?? []).map((valueId) => ({ id: valueId })),
                },
                ...(resolved && resolved.assignmentValueIds.length > 0 && {
                    attributeValueAssignments: {
                        create: resolved.assignmentValueIds.map((valueId) => ({
                            source: resolved.source,
                            attributeValue: { connect: { id: valueId } },
                        })),
                    },
                }),
            },
        })
    })

    return buildLeadCustomerDetail(id)
}

/**
 * Adres yazma yolları — hepsi önce `getLeadCustomerRowOrThrow` ile LEAD kontrolü
 * yapar, böylece cari müşteriye dönmüş bir kaydın adresi bu yüzeyden
 * değiştirilemez. Yazma işi core repository'ye devredilir; normalize etme kuralı
 * `customerAddressInput.ts` içinde ProtectedApi ile ORTAK.
 */
export async function createLeadCustomerAddress({
    customerRepository,
    customerId,
    body,
    verifiedByUserId,
}: {
    customerRepository: IPrismaCustomerRepository
    customerId: string
    body: CustomerAddressBody
    verifiedByUserId?: string | null
}): Promise<LeadCustomerDetail> {
    await getLeadCustomerRowOrThrow(customerId)

    await customerRepository.createAddress(
        customerId,
        await prepareCustomerAddressInput(body, {
            defaultLocationSource: "MANUAL_PIN",
            verifiedByUserId,
            allowVerification: true,
        }),
    )

    return buildLeadCustomerDetail(customerId)
}

export async function updateLeadCustomerAddress({
    customerRepository,
    customerId,
    addressId,
    body,
    verifiedByUserId,
}: {
    customerRepository: IPrismaCustomerRepository
    customerId: string
    addressId: string
    body: CustomerAddressBody
    verifiedByUserId?: string | null
}): Promise<LeadCustomerDetail> {
    await getLeadCustomerRowOrThrow(customerId)

    const address = await customerRepository.getAddress(customerId, addressId)
    if (!address) throw new createError.NotFound("Adres bulunamadı")

    await customerRepository.updateAddress(
        customerId,
        addressId,
        await prepareCustomerAddressInput(body, {
            defaultLocationSource: "MANUAL_PIN",
            verifiedByUserId,
            allowVerification: true,
            // Aynı place ID hâlâ taze koordinat taşıyorsa Google'a gidilmez.
            existing: address,
        }),
    )

    return buildLeadCustomerDetail(customerId)
}

export async function deleteLeadCustomerAddress({
    customerRepository,
    customerId,
    addressId,
}: {
    customerRepository: IPrismaCustomerRepository
    customerId: string
    addressId: string
}): Promise<LeadCustomerDetail> {
    await getLeadCustomerRowOrThrow(customerId)

    const address = await customerRepository.getAddress(customerId, addressId)
    if (!address) throw new createError.NotFound("Adres bulunamadı")

    await customerRepository.deleteAddress(customerId, addressId)

    return buildLeadCustomerDetail(customerId)
}
