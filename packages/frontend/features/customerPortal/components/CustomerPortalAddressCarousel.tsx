"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { ChevronLeft, ChevronRight, MapPin, Pencil, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AdminCustomer, CustomerAddress } from "@/features/admin/customers/api/types"
import { CustomerPortalAddressRequestDialog } from "@/features/customerPortal/components/CustomerPortalAddressRequestDialog"
import { useCreatePortalCustomerAddress } from "@/features/customerPortal/hooks/useCreatePortalCustomerAddress"
import { useDeletePortalCustomerAddress } from "@/features/customerLocations/hooks/useDeletePortalCustomerAddress"
import { useUpdatePortalCustomerAddress } from "@/features/customerLocations/hooks/useUpdatePortalCustomerAddress"
import { toAddressDraftValues } from "@/features/customerLocations/lib/toAddressDraftValues"
import type { addressDraftSchema } from "@/features/customerPortal/components/requestComposer/schema"
import type { z } from "zod"
import { cn } from "@/lib/utils"

type Props = {
    customer: AdminCustomer
}

function getAddressLines(address: CustomerAddress) {
    return [
        address.line1 ? { label: "Adres", value: address.line1 } : null,
        address.line2 ? { label: "Devam", value: address.line2 } : null,
        [address.district, address.city].filter(Boolean).length > 0
            ? { label: "Bölge", value: [address.district, address.city].filter(Boolean).join(" / ") }
            : null,
        address.country ? { label: "Ülke", value: address.country } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>
}

function getAddressNotes(address: CustomerAddress) {
    return [
        address.contactName ? { label: "İrtibat", value: address.contactName } : null,
        address.phone ? { label: "Telefon", value: address.phone } : null,
        address.email ? { label: "E-posta", value: address.email } : null,
        address.postalCode ? { label: "Posta Kodu", value: address.postalCode } : null,
        address.taxOffice ? { label: "Vergi Dairesi", value: address.taxOffice } : null,
        address.taxNumber ? { label: "Vergi No", value: address.taxNumber } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>
}

function AddressCard({
    address,
    index,
    onEdit,
}: {
    address: CustomerAddress
    index: number
    onEdit: (address: CustomerAddress) => void
}) {
    const addressLines = getAddressLines(address)
    const notes = getAddressNotes(address)

    return (
        <motion.article
            key={address.id}
            className="flex h-full min-h-[360px] w-full flex-col rounded-[30px] border border-neutral-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(250,250,249,0.96)_100%)] p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] sm:min-h-[430px] sm:p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut", delay: index * 0.04 }}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-base font-semibold text-neutral-950">{address.label}</div>
                    <p className="mt-1 text-sm leading-6 text-neutral-500">
                        Fatura, sevkiyat ve operasyon için kayıtlı adres.
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    {address.isPrimary ? <Badge variant="secondary">Birincil</Badge> : null}
                    {address.isBilling ? <Badge variant="outline">Fatura</Badge> : null}
                    {address.isShipping ? <Badge variant="outline">Sevkiyat</Badge> : null}
                </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-neutral-200 bg-white/80 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Adres Detayı
                </div>
                <div className="mt-3 space-y-2.5">
                    {addressLines.length > 0 ? addressLines.map((item) => (
                        <div key={`${address.id}-${item.label}`} className="grid gap-1 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-3">
                            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                                {item.label}
                            </span>
                            <span className="min-w-0 text-sm font-medium leading-6 text-neutral-800">
                                {item.value}
                            </span>
                        </div>
                    )) : (
                        <p className="text-sm leading-6 text-neutral-500">Adres detayı henüz girilmemiş.</p>
                    )}
                </div>
            </div>

            <div className="mt-5 grid gap-2 text-sm text-neutral-700">
                {notes.map((item) => (
                    <div key={`${address.id}-${item.label}`} className="flex items-start justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5">
                        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                            {item.label}
                        </span>
                        <span className="min-w-0 flex-1 text-right text-sm font-medium text-neutral-800 line-clamp-1">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>

            {address.note ? (
                <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-white/70 px-3 py-2.5">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">Not</div>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-700">{address.note}</p>
                </div>
            ) : null}

            <div className="mt-auto pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => onEdit(address)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Düzenle
                </Button>
            </div>
        </motion.article>
    )
}

function AddAddressCard({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Yeni adres ekle"
            className="group flex h-full min-h-[360px] w-full flex-col overflow-hidden rounded-[30px] border border-dashed border-brand/25 bg-[radial-gradient(circle_at_top,rgba(214,179,93,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(250,250,249,0.98)_100%)] p-5 text-left shadow-[0_12px_30px_-24px_rgba(15,23,42,0.3)] transition hover:-translate-y-0.5 hover:border-brand/45 hover:bg-[radial-gradient(circle_at_top,rgba(214,179,93,0.22),transparent_34%),linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(250,250,249,0.98)_100%)] sm:min-h-[430px] sm:p-6"
        >
            <div className="flex flex-1 flex-col items-center justify-center rounded-[26px] border border-white/70 bg-white/65 px-6 py-8 text-center">
                <div className="flex size-20 items-center justify-center rounded-full border border-brand/15 bg-brand/10 text-brand shadow-[0_14px_35px_-26px_color-mix(in_oklch,var(--color-brand),black_20%)] transition group-hover:scale-105">
                    <Plus className="size-8" />
                </div>
                <div className="mt-5 text-xl font-semibold text-neutral-950">Yeni Adres Ekle</div>
                <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-500">
                    Fatura, sevkiyat veya operasyon adresi ekleyin.
                </p>
            </div>
        </button>
    )
}

export function CustomerPortalAddressCarousel({ customer }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const createMutation = useCreatePortalCustomerAddress()
    const updateMutation = useUpdatePortalCustomerAddress(editingAddress?.id ?? "")
    const deleteMutation = useDeletePortalCustomerAddress(editingAddress?.id ?? "")
    const addresses = customer.addresses ?? []
    const scrollerRef = useRef<HTMLDivElement | null>(null)
    const itemRefs = useRef<Array<HTMLDivElement | null>>([])
    const totalItems = addresses.length + 1
    const showArrows = totalItems > 1
    const boundedActiveIndex = Math.min(activeIndex, addresses.length)
    const activeItemLabel = boundedActiveIndex >= addresses.length ? "Yeni adres kartı" : `Adres ${boundedActiveIndex + 1}`

    function scrollToIndex(index: number) {
        const boundedIndex = Math.max(0, Math.min(index, addresses.length))
        const scroller = scrollerRef.current
        const target = itemRefs.current[boundedIndex]

        if (scroller && target) {
            scroller.scrollTo({
                left: target.offsetLeft - scroller.offsetLeft,
                behavior: "smooth",
            })
        }

        setActiveIndex(boundedIndex)
    }

    useEffect(() => {
        const scroller = scrollerRef.current
        if (!scroller) return
        const currentScroller = scroller

        function handleScroll() {
            let nextIndex = 0
            let nearestDistance = Number.POSITIVE_INFINITY

            itemRefs.current.forEach((item, index) => {
                if (!item) return
                const distance = Math.abs((item.offsetLeft - currentScroller.offsetLeft) - currentScroller.scrollLeft)
                if (distance < nearestDistance) {
                    nearestDistance = distance
                    nextIndex = index
                }
            })

            setActiveIndex((current) => nextIndex !== current ? nextIndex : current)
        }

        currentScroller.addEventListener("scroll", handleScroll, { passive: true })
        return () => {
            currentScroller.removeEventListener("scroll", handleScroll)
        }
    }, [addresses.length])

    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, totalItems)
    }, [totalItems])

    useEffect(() => {
        setActiveIndex((current) => Math.min(current, addresses.length))
    }, [addresses.length])

    async function handleAddressSubmit(address: z.infer<typeof addressDraftSchema>) {
        if (editingAddress) {
            await updateMutation.mutateAsync(address)
        } else {
            await createMutation.mutateAsync(address)
        }
        setDialogOpen(false)
        setEditingAddress(null)
    }

    async function handleDelete() {
        if (!editingAddress) return

        const deletedIndex = addresses.findIndex((address) => address.id === editingAddress.id)
        const updatedCustomer = await deleteMutation.mutateAsync()
        const nextAddresses = updatedCustomer.addresses ?? []

        setActiveIndex(Math.min(deletedIndex === -1 ? activeIndex : deletedIndex, nextAddresses.length))
        setDialogOpen(false)
        setEditingAddress(null)
    }

    return (
        <section className="flex h-full min-w-0 flex-col rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                        <MapPin className="h-3.5 w-3.5" />
                        Adresler
                    </div>
                    <p className="mt-2 text-sm leading-6 text-neutral-500">
                        Fatura, sevkiyat ve operasyon adreslerinizi görüntüleyin.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                    {totalItems > 1 ? `${addresses.length} kayıt + yeni adres` : "Yeni adres kartı"}
                </div>
                {showArrows ? (
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-full"
                            onClick={() => scrollToIndex(boundedActiveIndex - 1)}
                            aria-label="Önceki adres"
                            disabled={boundedActiveIndex <= 0}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-full"
                            onClick={() => scrollToIndex(boundedActiveIndex + 1)}
                            aria-label="Sonraki adres"
                            disabled={boundedActiveIndex >= addresses.length}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                ) : null}
            </div>

            <div
                ref={scrollerRef}
                className="mt-5 flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {addresses.length > 0 ? addresses.map((address, index) => (
                    <div
                        key={address.id}
                        ref={(node) => {
                            itemRefs.current[index] = node
                        }}
                        className="flex max-w-full flex-none basis-full snap-start"
                    >
                        <AddressCard
                            address={address}
                            index={index}
                            onEdit={(nextAddress) => {
                                setEditingAddress(nextAddress)
                                setDialogOpen(true)
                            }}
                        />
                    </div>
                )) : null}

                <div
                    ref={(node) => {
                        itemRefs.current[addresses.length] = node
                    }}
                    className="flex max-w-full flex-none basis-full snap-start"
                >
                    <AddAddressCard
                        onClick={() => {
                            setEditingAddress(null)
                            setDialogOpen(true)
                        }}
                    />
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-neutral-500">
                    {activeItemLabel}
                </div>
                <div className="flex gap-1.5">
                    {Array.from({ length: totalItems }).map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => scrollToIndex(index)}
                            className={cn(
                                "h-2.5 rounded-full transition-all",
                                index === boundedActiveIndex
                                    ? "w-6 bg-brand"
                                    : "w-2.5 bg-neutral-300 hover:bg-neutral-400",
                            )}
                            aria-label={index >= addresses.length ? "Yeni adres kartına git" : `Adres ${index + 1} kartına git`}
                        />
                    ))}
                </div>
            </div>

            <CustomerPortalAddressRequestDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) {
                        setEditingAddress(null)
                    }
                }}
                onSubmit={handleAddressSubmit}
                onDelete={editingAddress ? handleDelete : undefined}
                initialValues={toAddressDraftValues(editingAddress)}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                isDeleting={deleteMutation.isPending}
            />
        </section>
    )
}
