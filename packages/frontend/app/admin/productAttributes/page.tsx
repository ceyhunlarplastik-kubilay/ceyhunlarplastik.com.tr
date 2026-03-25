import Link from "next/link"
// import { getAttributesForFilter } from "@/features/admin/productAttributes/server/getAttributesForFilter"
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter"
import { AttributeHeader } from "@/features/admin/productAttributes/components/AttributeHeader"

export default async function Page() {

    const attributes = await getAttributesForFilter()

    return (
        <div className="p-6 space-y-6">

            {/* HEADER */}
            <AttributeHeader />

            {/* LIST */}
            <div className="grid gap-4">

                {attributes.map(attr => (

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
                            </div>

                            <span className="text-xs text-neutral-400">
                                {attr.values?.length ?? 0} değer
                            </span>

                        </div>
                    </Link>

                ))}

            </div>

        </div>
    )
}