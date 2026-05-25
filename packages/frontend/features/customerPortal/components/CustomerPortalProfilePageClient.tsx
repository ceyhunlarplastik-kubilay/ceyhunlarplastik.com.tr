"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Building2 } from "lucide-react"
import { ProductCard } from "@/components/navigation/ProductCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { usePortalCustomer } from "@/features/customerPortal/hooks/usePortalCustomer"
import { usePortalFeaturedProducts } from "@/features/customerPortal/hooks/usePortalFeaturedProducts"
import { CustomerPortalPageHeader } from "@/features/customerPortal/components/CustomerPortalPageHeader"
import { getPrimaryCustomerContact } from "@/lib/customers/contactCards"

export function CustomerPortalProfilePageClient() {
    const query = usePortalCustomer()
    const customer = query.data
    const featuredQuery = usePortalFeaturedProducts()
    const featuredProducts = (featuredQuery.data ?? []).slice(0, 3)
    const primaryContact = customer ? getPrimaryCustomerContact(customer) : null

    if (query.isLoading) {
        return (
            <div className="flex min-h-[220px] items-center justify-center rounded-3xl border bg-white shadow-sm">
                <Spinner className="size-5" />
            </div>
        )
    }

    if (!customer) {
        return <div className="rounded-3xl border bg-white p-8 text-sm text-red-600 shadow-sm">Müşteri profili bulunamadı.</div>
    }

    return (
        <div className="space-y-6">
            <CustomerPortalPageHeader
                eyebrow="Kurumsal Profil"
                icon={Building2}
                title="Profil / Firma Bilgileri"
                description="Firma kayıtlarınızı, irtibat bilgilerinizi ve sektörel eşleşmenizi bu ekrandan takip edebilirsiniz."
                meta={[
                    { value: customer.companyName || "-", label: "firma" },
                    { value: primaryContact?.name || customer.fullName, label: "yetkili" },
                ]}
            />

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Firma</div>
                        <div className="mt-2 text-sm font-medium text-neutral-900">{customer.companyName || "-"}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Yetkili Kişi</div>
                        <div className="mt-2 text-sm font-medium text-neutral-900">{primaryContact?.name || customer.fullName}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">E-posta</div>
                        <div className="mt-2 text-sm font-medium text-neutral-900">{primaryContact?.email || customer.email}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Telefon</div>
                        <div className="mt-2 text-sm font-medium text-neutral-900">{primaryContact?.phone || customer.phone}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Sektör</div>
                        <div className="mt-2 text-sm font-medium text-neutral-900">{customer.sectorValue?.name ?? "-"}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Üretim Grubu</div>
                        <div className="mt-2 text-sm font-medium text-neutral-900">{customer.productionGroupValue?.name ?? "-"}</div>
                    </div>
                </div>

                {(customer.usageAreaValues?.length ?? 0) > 0 ? (
                    <div className="mt-6">
                        <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Kullanım Alanları</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {customer.usageAreaValues?.map((value) => (
                                <Badge key={value.id} variant="secondary">
                                    {value.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-neutral-950">İlgili Ürünlerden Önizleme</h2>
                        <p className="mt-1 text-sm text-neutral-500">Firmanızla ilişkili ürünlerden kısa bir görünüm.</p>
                    </div>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href="/musteri/tanimli-urunler">
                            Tümünü Gör
                            <ArrowRight className="size-4" />
                        </Link>
                    </Button>
                </div>

                {featuredQuery.isLoading ? (
                    <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50">
                        <Spinner className="size-5" />
                    </div>
                ) : featuredProducts.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    >
                        {featuredProducts.map((item) => {
                            const primary = item.product.assets?.find((asset) => asset.role === "PRIMARY")
                            const animated = item.product.assets?.find((asset) => asset.role === "ANIMATION")
                            const fallback = item.product.assets?.find((asset) => asset.type?.startsWith("IMAGE"))

                            return (
                                <ProductCard
                                    key={item.id}
                                    title={item.product.name}
                                    code={item.product.code}
                                    href={`/musteri/tum-urunler/urun/${item.product.slug}`}
                                    imageStatic={primary?.url || fallback?.url || "/placeholder.webp"}
                                    imageAnimated={animated?.url}
                                    attributeValues={item.product.attributeValues}
                                    showSpecialAttributeValues
                                />
                            )
                        })}
                    </motion.div>
                ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-sm text-neutral-500">
                        Bu müşteri için henüz ilgili ürün bulunmuyor.
                    </div>
                )}
            </div>
        </div>
    )
}
