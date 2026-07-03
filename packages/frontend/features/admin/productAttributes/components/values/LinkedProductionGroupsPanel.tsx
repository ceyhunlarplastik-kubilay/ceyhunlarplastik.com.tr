import { Layers3 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { ProductAttributeValue } from "@/features/admin/productAttributes/types"

type Props = {
    groups: ProductAttributeValue[]
}

export function LinkedProductionGroupsPanel({ groups }: Props) {
    return (
        <div className="border-t border-amber-100 bg-amber-50/70 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                <Layers3 className="h-4 w-4" />
                Seçilen sektöre bağlı üretim grupları
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {groups.length > 0 ? (
                    groups.map((group) => (
                        <Badge
                            key={group.id}
                            className="border border-amber-200 bg-white text-amber-900 hover:bg-white"
                        >
                            {group.name}
                        </Badge>
                    ))
                ) : (
                    <p className="text-sm text-amber-800">
                        Bu sektöre bağlı üretim grubu bulunamadı.
                    </p>
                )}
            </div>
        </div>
    )
}
