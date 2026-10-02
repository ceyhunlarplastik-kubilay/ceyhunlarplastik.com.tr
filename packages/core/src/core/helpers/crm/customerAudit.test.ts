import { describe, expect, it } from "vitest"

import { diffAuditSnapshots } from "@/core/helpers/audit/auditDiff"

import {
    customerAuditLabel,
    customerAuditUserLabel,
    toCustomerAuditSnapshot,
    type CustomerAuditRow,
} from "./customerAudit"
import { GOOGLE_PLACES_PROVIDER } from "./customerAddressInput"

type AddressRow = CustomerAuditRow["addresses"][number]

const address = (overrides: Partial<AddressRow> = {}): AddressRow => ({
    label: "Merkez",
    contactName: null,
    phone: null,
    email: null,
    line1: "Atatürk Cad. 5",
    line2: null,
    district: "Kadıköy",
    city: "İstanbul",
    country: "Turkiye",
    postalCode: null,
    taxOffice: null,
    taxNumber: null,
    note: null,
    isPrimary: true,
    isBilling: false,
    isShipping: true,
    latitude: null,
    longitude: null,
    geocodingProvider: null,
    locationVerifiedAt: null,
    stateRef: null,
    ...overrides,
}) as AddressRow

const row = (overrides: Partial<CustomerAuditRow> = {}): CustomerAuditRow => ({
    id: "customer-1",
    companyName: "Acme Plastik",
    fullName: "Ayşe Yılmaz",
    phone: "0555 111 22 33",
    email: "ayse@acme.com",
    websiteUrl: null,
    note: null,
    status: "LEAD",
    generalDiscountPercent: null,
    defaultPaymentTermDays: null,
    creditLimit: null,
    paymentTermNote: null,
    assignedSalesUserId: null,
    convertedAt: null,
    convertedByUserId: null,
    sectorValueId: null,
    productionGroupValueId: null,
    createdAt: new Date("2026-10-01T10:00:00.000Z"),
    updatedAt: new Date("2026-10-01T10:00:00.000Z"),
    additionalPhones: [],
    addresses: [],
    assignedSalesUser: null,
    sectorValue: null,
    productionGroupValue: null,
    usageAreaValues: [],
    attributeValueAssignments: [],
    companyContactAssignments: [],
    ...overrides,
}) as CustomerAuditRow

const decimal = (value: string) => ({ toString: () => value }) as unknown as CustomerAuditRow["creditLimit"]

describe("toCustomerAuditSnapshot", () => {
    it("müşteri alanlarını, ticari alanları ve referansları adıyla verir", () => {
        const snapshot = toCustomerAuditSnapshot(row({
            status: "CUSTOMER",
            generalDiscountPercent: decimal("12.5"),
            creditLimit: decimal("250000"),
            defaultPaymentTermDays: 60,
            assignedSalesUser: { firstName: "Mehmet", lastName: "Kaya", identifier: "mkaya", email: "mehmet@ceyhunlar.com" },
            sectorValue: { name: "Otomotiv" },
            productionGroupValue: { name: "Plastik Enjeksiyon" },
            usageAreaValues: [{ name: "Tutamak" }, { name: "Kapak" }],
        }))

        expect(snapshot).toMatchObject({
            companyName: "Acme Plastik",
            status: "CUSTOMER",
            generalDiscountPercent: "12.5",
            creditLimit: "250000",
            defaultPaymentTermDays: 60,
            assignedSalesUser: "Mehmet Kaya (mehmet@ceyhunlar.com)",
            sector: "Otomotiv",
            productionGroup: "Plastik Enjeksiyon",
            usageAreas: ["Kapak", "Tutamak"],
        })
    })

    it("boş metin ile null'ı aynı sayar (veri girişindeki boş e-posta değişiklik üretmez)", () => {
        expect(diffAuditSnapshots(
            toCustomerAuditSnapshot(row({ email: "", note: "  " })),
            toCustomerAuditSnapshot(row({ email: null as unknown as string, note: null })),
        )).toEqual([])
    })

    it("profil atamalarında sektör / üretim grubu / kullanım alanını tekrar etmez", () => {
        const snapshot = toCustomerAuditSnapshot(row({
            attributeValueAssignments: [
                { attributeValue: { name: "Otomotiv", attribute: { code: "sector", name: "Sektör" } } },
                { attributeValue: { name: "Tutamak", attribute: { code: "usage_area", name: "Kullanım Alanı" } } },
                { attributeValue: { name: "Büyük Ölçek", attribute: { code: "company_size", name: "Firma Ölçeği" } } },
            ],
        }))

        expect(snapshot.profileAttributes).toEqual(["Firma Ölçeği: Büyük Ölçek"])
    })

    it("ek telefonları sırayla, etiketiyle; iletişim kişilerini pasif işaretiyle yazar", () => {
        const snapshot = toCustomerAuditSnapshot(row({
            additionalPhones: [
                { number: "0212 000 00 01", label: "Muhasebe" },
                { number: "0212 000 00 02", label: null },
            ],
            companyContactAssignments: [
                { isActive: true, companyContact: { name: "Zeynep", department: "Satış" } },
                { isActive: false, companyContact: { name: "Ali", department: "Lojistik" } },
            ],
        }))

        expect(snapshot.additionalPhones).toEqual(["0212 000 00 01 (Muhasebe)", "0212 000 00 02"])
        expect(snapshot.companyContacts).toEqual(["Zeynep · Satış", "Ali · Lojistik (pasif)"])
    })

    describe("adresler", () => {
        it("etiketle anahtarlanır; bayraklar tek liste, il adı referanstan", () => {
            const snapshot = toCustomerAuditSnapshot(row({
                addresses: [address({ isBilling: true, taxNumber: "1234567890", stateRef: { name: "İstanbul" } })],
            }))

            expect(snapshot).toMatchObject({
                "addresses.Merkez.line1": "Atatürk Cad. 5",
                "addresses.Merkez.district": "Kadıköy",
                "addresses.Merkez.state": "İstanbul",
                "addresses.Merkez.taxNumber": "1234567890",
                "addresses.Merkez.roles": ["PRIMARY", "BILLING", "SHIPPING"],
                "addresses.Merkez.location": null,
            })
        })

        it("aynı etiketi ikinci kez görürse sırayla ayırır", () => {
            const snapshot = toCustomerAuditSnapshot(row({
                addresses: [address(), address({ line1: "Depo Sok. 1" })],
            }))

            expect(snapshot["addresses.Merkez.line1"]).toBe("Atatürk Cad. 5")
            expect(snapshot["addresses.Merkez (2).line1"]).toBe("Depo Sok. 1")
        })

        it("elle işaretlenen konumu yazar, Google önbellek koordinatını yazmaz", () => {
            const manual = toCustomerAuditSnapshot(row({
                addresses: [address({ latitude: 41.0082 as never, longitude: 28.9784 as never })],
            }))
            const google = toCustomerAuditSnapshot(row({
                addresses: [address({
                    latitude: 41.0082 as never,
                    longitude: 28.9784 as never,
                    geocodingProvider: GOOGLE_PLACES_PROVIDER,
                })],
            }))

            expect(manual["addresses.Merkez.location"]).toBe("41.008200, 28.978400")
            expect(google["addresses.Merkez.location"]).toBeNull()
        })

        it("Google cron'unun koordinat yenilemesi / temizlemesi fark üretmez", () => {
            const before = row({
                addresses: [address({ geocodingProvider: GOOGLE_PLACES_PROVIDER, latitude: 41 as never, longitude: 29 as never })],
            })
            const after = row({
                addresses: [address({ geocodingProvider: GOOGLE_PLACES_PROVIDER, latitude: null, longitude: null })],
            })

            expect(diffAuditSnapshots(toCustomerAuditSnapshot(before), toCustomerAuditSnapshot(after))).toEqual([])
        })

        it("adresleri silip aynı içerikle yeniden yazmak (iş talebi onayı) fark üretmez", () => {
            const before = row({ addresses: [address(), address({ label: "Depo", isPrimary: false })] })
            const rewritten = row({ addresses: [address(), address({ label: "Depo", isPrimary: false })] })

            expect(diffAuditSnapshots(toCustomerAuditSnapshot(before), toCustomerAuditSnapshot(rewritten))).toEqual([])
        })

        it("tek alan değişikliğini adres etiketiyle birlikte gösterir", () => {
            const changes = diffAuditSnapshots(
                toCustomerAuditSnapshot(row({ addresses: [address()] })),
                toCustomerAuditSnapshot(row({ addresses: [address({ district: "Üsküdar" })] })),
            )

            expect(changes).toEqual([
                { field: "addresses.Merkez.district", before: "Kadıköy", after: "Üsküdar" },
            ])
        })
    })
})

describe("customerAuditLabel / customerAuditUserLabel", () => {
    it("firma adı, yoksa yetkili, o da yoksa telefon", () => {
        expect(customerAuditLabel({ companyName: "Acme", fullName: "Ayşe", phone: "555" })).toBe("Acme")
        expect(customerAuditLabel({ companyName: " ", fullName: "Ayşe", phone: "555" })).toBe("Ayşe")
        expect(customerAuditLabel({ companyName: null, fullName: null, phone: "555" })).toBe("555")
    })

    it("kullanıcıyı ad + e-postayla tanıtır", () => {
        expect(customerAuditUserLabel({ firstName: "Mehmet", lastName: "Kaya", email: "m@x.com" })).toBe("Mehmet Kaya (m@x.com)")
        expect(customerAuditUserLabel({ email: "m@x.com" })).toBe("m@x.com")
        expect(customerAuditUserLabel({ identifier: "mkaya", email: "m@x.com" })).toBe("mkaya (m@x.com)")
        expect(customerAuditUserLabel(null)).toBeNull()
    })
})
