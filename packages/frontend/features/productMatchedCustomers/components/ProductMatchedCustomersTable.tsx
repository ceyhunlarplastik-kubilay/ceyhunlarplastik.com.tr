"use client"

import Link from "next/link"
import { Building2, Mail, MapPin, Phone, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ProductMatchedCustomer } from "@/features/productMatchedCustomers/api/types"

type Props = {
    customers: ProductMatchedCustomer[]
    customerBasePath: string
    emptyMessage: string
}

export function ProductMatchedCustomersTable({ customers, customerBasePath, emptyMessage }: Props) {
    return (
        <div className="overflow-x-auto rounded-xl border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Firma / Yetkili</TableHead>
                        <TableHead className="w-[110px]">Durum</TableHead>
                        <TableHead className="w-[170px]">Konum</TableHead>
                        <TableHead className="w-[160px]">Profil</TableHead>
                        <TableHead className="w-[200px]">Eşleşme</TableHead>
                        <TableHead className="w-[220px]">İletişim</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.map((customer) => {
                        const title = customer.companyName ?? customer.fullName ?? "İsimsiz kayıt"
                        const subtitle = customer.companyName ? customer.fullName : null

                        return (
                            <TableRow key={customer.id} className="border-b hover:bg-neutral-50">
                                <TableCell>
                                    <Link
                                        href={`${customerBasePath}/${customer.id}`}
                                        className="font-semibold text-neutral-900 underline-offset-2 hover:underline"
                                    >
                                        {title}
                                    </Link>
                                    {subtitle ? <p className="text-xs text-neutral-500">{subtitle}</p> : null}
                                    {customer.assignedSalesUserName ? (
                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                                            <UserRound className="h-3 w-3" />
                                            {customer.assignedSalesUserName}
                                        </p>
                                    ) : null}
                                </TableCell>
                                <TableCell>
                                    {customer.status === "CUSTOMER" ? (
                                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Cari</Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-amber-300 text-amber-700">Potansiyel</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {customer.locationSummary ? (
                                        <span
                                            className="flex items-center gap-1 text-sm text-neutral-700"
                                            title={customer.address?.summary ?? undefined}
                                        >
                                            <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                                            {customer.locationSummary}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-neutral-400">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-0.5 text-xs text-neutral-600">
                                        {customer.sectorName ? <p>{customer.sectorName}</p> : null}
                                        {customer.productionGroupName ? (
                                            <p className="text-neutral-400">{customer.productionGroupName}</p>
                                        ) : null}
                                        {!customer.sectorName && !customer.productionGroupName ? (
                                            <span className="text-neutral-400">-</span>
                                        ) : null}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {customer.matchedLabels.length > 0 ? (
                                            customer.matchedLabels.map((label) => (
                                                <Badge key={label} variant="secondary" className="font-normal">
                                                    {label}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-neutral-400">-</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-0.5 text-xs text-neutral-600">
                                        <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:underline">
                                            <Phone className="h-3 w-3 text-neutral-400" />
                                            {customer.phone}
                                        </a>
                                        <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:underline">
                                            <Mail className="h-3 w-3 text-neutral-400" />
                                            {customer.email}
                                        </a>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}

                    {customers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                                <Building2 className="mx-auto mb-2 h-6 w-6 text-neutral-300" />
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : null}
                </TableBody>
            </Table>
        </div>
    )
}
