import createError from "http-errors"

import { prisma } from "@/core/db/prisma"
import {
    prepareCustomerAddressInput,
    type CustomerAddressBody,
} from "@/core/helpers/crm/customerAddressInput"
import { CUSTOMER_ATTRIBUTE_CODES, resolveCustomerAttributeAssignments } from "@/core/helpers/crm/customerAttributes"
import { normalizeWebsiteUrl } from "@/core/helpers/crm/customerWebsite"
import {
    getCustomerProfileMatchedProducts,
    type CustomerProfileMatchedProduct,
} from "@/core/helpers/crm/customerProfileMatchedProducts"
import { mapCustomerAddressForApi } from "@/core/helpers/crm/mapCustomerForApi"
import {
    normalizeCustomerAdditionalPhones,
    type CustomerAdditionalPhoneInput,
} from "@/core/helpers/crm/customerPhones"
import { buildAdditionalPhonesReplaceWrite } from "@/core/helpers/crm/customerUpdateData"
import {
    buildCustomerAdditionalPhoneSearchWhere,
    customerPhoneOrderBy,
    customerPhoneSelect,
    type IPrismaCustomerRepository,
} from "@/core/helpers/prisma/customers/repository"
import type { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { Prisma } from "@/prisma/generated/prisma/client"
import type { AuditContext } from "@/core/helpers/audit/types"

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


export type LeadCustomerAttributeValue = {
    id: string
    name: string
    slug: string
    parentValueId: string | null
}

/** Ek telefon — alanlar `customerPhoneSelect` ile birebir aynı. */
export type LeadCustomerPhone = {
    id: string
    number: string
    label: string | null
    displayOrder: number
}

export type LeadCustomerSummary = {
    id: string
    companyName: string | null
    websiteUrl: string | null
    /** Yetkili adı opsiyonel: veri girişinde firma kaydedilir, kişi sonra öğrenilir. */
    fullName: string | null
    /** Birincil numara; ek numaralar `additionalPhones`'ta. */
    phone: string
    additionalPhones: LeadCustomerPhone[]
    email: string
    note: string | null
    sectorValue: LeadCustomerAttributeValue | null
    productionGroupValue: LeadCustomerAttributeValue | null
    usageAreaValues: LeadCustomerAttributeValue[]
    createdAt: Date
    updatedAt: Date
}

/** Ortak CRM tipi — potansiyel/cari ayrımı yok. */
export type LeadCustomerMatchedProduct = CustomerProfileMatchedProduct

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
    /**
     * Verilmezse ek numaralara DOKUNULMAZ (eski istemciler bozulmasın); verilirse
     * TAM DEĞİŞİM — `[]` hepsini siler. Kural `customerPhones.ts`'te.
     */
    additionalPhones?: CustomerAdditionalPhoneInput[]
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
    // Alan listesi yanıt şemasıyla (`leadCustomerSummarySchema`, KATI) aynı olmalı.
    additionalPhones: {
        select: customerPhoneSelect,
        orderBy: customerPhoneOrderBy,
    },
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
        additionalPhones: customer.additionalPhones,
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
            buildCustomerAdditionalPhoneSearchWhere(normalized),
        ],
    }
}

/**
 * Adres filtresi.
 *
 * Normalize FK'lar (`countryId`/`stateId`/`cityId`) kullanılır, görüntü metinleri
 * (`country`/`city`/`district`) DEĞİL: FK'lar indekslidir
 * (`@@index([countryId])`, `@@index([stateId])`) ve metnin nasıl yazıldığından
 * bağımsızdır. Hiyerarşi ülke → il (`GeoState`) → ilçe (`GeoCity`).
 *
 * `some`: müşterinin HERHANGİ bir adresi eşleşiyorsa kayıt listeye girer —
 * birden çok adresi olan bir aday, şubelerinden biri o ildeyse bulunmalı.
 */
function buildAddressWhere(filter: {
    countryId?: number
    stateId?: number
    cityId?: number
}): Prisma.CustomerWhereInput {
    const address: Prisma.CustomerAddressWhereInput = {
        ...(filter.countryId ? { countryId: filter.countryId } : {}),
        ...(filter.stateId ? { stateId: filter.stateId } : {}),
        ...(filter.cityId ? { cityId: filter.cityId } : {}),
    }

    if (Object.keys(address).length === 0) return {}

    return { addresses: { some: address } }
}

export async function listLeadCustomers({
    page,
    limit,
    search,
    sectorValueId,
    usageAreaValueId,
    countryId,
    stateId,
    cityId,
}: {
    page: number
    limit: number
    search?: string
    sectorValueId?: string
    usageAreaValueId?: string
    /** Adres filtresi — normalize FK'lar üzerinden (bkz. buildAddressWhere). */
    countryId?: number
    stateId?: number
    cityId?: number
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
        ...buildAddressWhere({ countryId, stateId, cityId }),
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
 * Profil eşleşmesinin ÖNİZLEMESİ. Eşleşme kuralları + ince `select`
 * `getCustomerProfileMatchedProducts` (paylaşılan CRM helper) içinde; burada
 * yalnız potansiyel müşteri detay yanıtının beklediği iki alan alınır
 * (`hasProfile` bu yüzeyde `sectorValue`/`usageAreaValues`'tan istemcide türer).
 */
async function getMatchedProductPreview(customerId: string) {
    const { matchedProductCount, matchedProducts } = await getCustomerProfileMatchedProducts(customerId)
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
    audit,
}: {
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
    /** Customer'a yazan tek yer repository'dir (denetim kaydı orada yazılır). */
    customerRepository: IPrismaCustomerRepository
    /** Denetim kaydının kimi / nereden bilgisi — handler istekten kurar. */
    audit: AuditContext
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
    const additionalPhones = normalizeCustomerAdditionalPhones(input.additionalPhones ?? [], {
        primaryPhone: input.phone,
    })

    const customer = await customerRepository.createCustomer({
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
        ...(additionalPhones.length > 0 && {
            additionalPhones: { createMany: { data: additionalPhones } },
        }),
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
    // Adres müşteriyle AYNI transaction'da yazılır: eskiden ayrı yazılıyordu ve adres
    // düşerse adressiz yarım kayıt kalıyordu.
    }, audit, { address: normalizedAddress })

    return buildLeadCustomerDetail(customer.id)
}

export async function updateLeadCustomer({
    productAttributeValueRepository,
    customerRepository,
    id,
    input,
    audit,
}: {
    productAttributeValueRepository: IPrismaProductAttributeValueRepository
    customerRepository: IPrismaCustomerRepository
    id: string
    input: LeadCustomerProfileInput
    audit: AuditContext
}): Promise<LeadCustomerDetail> {
    await getLeadCustomerRowOrThrow(id)

    const resolved = await resolveProfileAssignments(productAttributeValueRepository, input)
    // Saf hazırlık transaction DIŞINDA; içeride yalnız yazma kalır.
    const additionalPhones = input.additionalPhones !== undefined
        ? normalizeCustomerAdditionalPhones(input.additionalPhones, { primaryPhone: input.phone })
        : undefined

    // Hiyerarşi atamaları TAM DEĞİŞİM: eski sector/production_group/usage_area
    // satırları silinip yenileri yazılır. Hiyerarşi dışındaki müşteri
    // attribute'larına (varsa) dokunulmaz — onlar bu yüzeyin işi değil.
    const hierarchyCodes = [
        CUSTOMER_ATTRIBUTE_CODES.sector,
        CUSTOMER_ATTRIBUTE_CODES.productionGroup,
        CUSTOMER_ATTRIBUTE_CODES.usageArea,
    ]

    // Hiyerarşi atamalarının silinmesi ve yeni hâlin yazılması TEK transaction'da ve
    // denetim kaydıyla birlikte repository'de.
    await customerRepository.updateCustomer(id, {
        companyName: input.companyName.trim(),
        websiteUrl: normalizeWebsiteUrl(input.websiteUrl),
        fullName: normalizeText(input.fullName),
        phone: input.phone.trim(),
        ...(additionalPhones && {
            additionalPhones: buildAdditionalPhonesReplaceWrite(additionalPhones),
        }),
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
    }, audit, { replaceAttributeAssignmentCodes: hierarchyCodes })

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
    audit,
}: {
    customerRepository: IPrismaCustomerRepository
    customerId: string
    body: CustomerAddressBody
    verifiedByUserId?: string | null
    audit: AuditContext
}): Promise<LeadCustomerDetail> {
    await getLeadCustomerRowOrThrow(customerId)

    await customerRepository.createAddress(
        customerId,
        await prepareCustomerAddressInput(body, {
            defaultLocationSource: "MANUAL_PIN",
            verifiedByUserId,
            allowVerification: true,
        }),
        audit,
    )

    return buildLeadCustomerDetail(customerId)
}

export async function updateLeadCustomerAddress({
    customerRepository,
    customerId,
    addressId,
    body,
    verifiedByUserId,
    audit,
}: {
    customerRepository: IPrismaCustomerRepository
    customerId: string
    addressId: string
    body: CustomerAddressBody
    verifiedByUserId?: string | null
    audit: AuditContext
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
        audit,
    )

    return buildLeadCustomerDetail(customerId)
}

export async function deleteLeadCustomerAddress({
    customerRepository,
    customerId,
    addressId,
    audit,
}: {
    customerRepository: IPrismaCustomerRepository
    customerId: string
    addressId: string
    audit: AuditContext
}): Promise<LeadCustomerDetail> {
    await getLeadCustomerRowOrThrow(customerId)

    const address = await customerRepository.getAddress(customerId, addressId)
    if (!address) throw new createError.NotFound("Adres bulunamadı")

    await customerRepository.deleteAddress(customerId, addressId, audit)

    return buildLeadCustomerDetail(customerId)
}

/**
 * Potansiyel müşterileri siler.
 *
 * Tekil ve toplu silme AYNI yoldan geçer: engel listesi, LEAD kilidi ve
 * cascade davranışı tek yerde kalsın (tekil uç `ids` uzunluğu 1 ile çağırır).
 *
 * Engelli kayıt işlemi düşürmez — silinebilenler silinir, engelliler adıyla
 * döner. Gerekçe ve şema davranışları: `leadCustomerDeletion.ts`.
 */
export async function deleteLeadCustomers({
    customerRepository,
    ids,
    audit,
}: {
    customerRepository: IPrismaCustomerRepository
    ids: readonly string[]
    audit: AuditContext
}): Promise<{
    deletedIds: string[]
    blocked: Array<{ id: string; name: string; reason: string }>
}> {
    // Engel kontrolü, silme ve denetim kayıtları repository'de TEK transaction'da.
    const plan = await customerRepository.deleteLeadCustomers(ids, audit)
    return { deletedIds: plan.deletableIds, blocked: plan.blocked }
}
