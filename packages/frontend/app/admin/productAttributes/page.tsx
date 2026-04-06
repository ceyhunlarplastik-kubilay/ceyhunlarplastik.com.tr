import Link from "next/link"
import { getAttributesForFilter } from "@/features/admin/productAttributes/server/getAttributesForFilter"
import { AttributeHeader } from "@/features/admin/productAttributes/components/AttributeHeader"

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ code?: string }>
}) {

    const params = await searchParams
    const selectedCode = params?.code?.trim()
    const attributes = await getAttributesForFilter()
    const hierarchyCodes = new Set(["sector", "production_group", "usage_area"])
    const filteredAttributes = selectedCode
        ? attributes.filter((attribute) => attribute.code === selectedCode)
        : attributes

    return (
        <div className="p-6 space-y-6">

            {/* HEADER */}
            <AttributeHeader />

            {/* LIST */}
            <div className="grid gap-4">

                {filteredAttributes.map(attr => (

                    <Link
                        key={attr.id}
                        href={`/admin/productAttributes/${attr.id}`}
                        className="border rounded-xl p-4 hover:bg-neutral-50 transition"
                    >
                        <div className="flex justify-between items-center">

                            <div>
                                <p className="font-semibold">
                                    {attr.name}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {attr.code}
                                </p>
                                {hierarchyCodes.has(attr.code) && (
                                    <p className="text-[11px] text-amber-700">
                                        Hiyerarsik alan (parent/child destekli)
                                    </p>
                                )}
                            </div>

                            <span className="text-xs text-neutral-400">
                                {attr.values?.length ?? 0} değer
                            </span>

                        </div>
                    </Link>

                ))}

                {filteredAttributes.length === 0 && (
                    <p className="text-sm text-neutral-500">
                        Seçilen koda ait özellik bulunamadı.
                    </p>
                )}

            </div>

        </div>
    )
}
