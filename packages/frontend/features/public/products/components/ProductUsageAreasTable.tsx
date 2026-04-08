import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

type AttributeValue = {
    id: string
    name: string
    parentValueId?: string | null
    attribute?: {
        code?: string
    }
    parentValue?: AttributeValue | null
}

type ProductLike = {
    attributeValues?: AttributeValue[]
}

type Props = {
    product: ProductLike
}

type Row = {
    sector: string
    productionGroup: string
    usageArea: string
}

function getAttributeCode(value?: AttributeValue | null) {
    return value?.attribute?.code ?? ""
}

function buildRows(attributeValues: AttributeValue[]): Row[] {
    const byId = new Map(attributeValues.map((value) => [value.id, value]))

    const getParent = (value?: AttributeValue | null) => {
        if (!value) return undefined
        return value.parentValue ?? (value.parentValueId ? byId.get(value.parentValueId) : undefined)
    }

    const usageValues = attributeValues.filter((value) => getAttributeCode(value) === "usage_area")
    const rows: Row[] = []
    const seen = new Set<string>()

    for (const usageValue of usageValues) {
        const productionGroupCandidate = getParent(usageValue)
        const productionGroup =
            getAttributeCode(productionGroupCandidate) === "production_group"
                ? productionGroupCandidate
                : undefined

        const sectorCandidate = getParent(productionGroup)
        const sector =
            getAttributeCode(sectorCandidate) === "sector"
                ? sectorCandidate
                : undefined

        const row = {
            sector: sector?.name ?? "-",
            productionGroup: productionGroup?.name ?? "-",
            usageArea: usageValue.name,
        }

        const rowKey = `${row.sector}|${row.productionGroup}|${row.usageArea}`
        if (seen.has(rowKey)) continue
        seen.add(rowKey)
        rows.push(row)
    }

    return rows
}

export default function ProductUsageAreasTable({ product }: Props) {
    const rows = buildRows((product.attributeValues ?? []) as AttributeValue[])

    if (!rows.length) return null

    return (
        <section id="usage-area-table" className="pt-10">
            <div className="mb-4">
                <h2 className="text-xl font-semibold tracking-tight">
                    Ürün Modelimizin Kullanıldığı Endüstriyel Alanlar
                </h2>
                <p className="text-sm text-neutral-500">
                    Sektör, üretim grubu ve kullanım alanı bazında örnek kullanım eşleşmeleri.
                </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-neutral-50">
                        <TableRow>
                            <TableHead className="w-14 px-4">#</TableHead>
                            <TableHead className="px-4">Sektör</TableHead>
                            <TableHead className="px-4">Üretim Grubu</TableHead>
                            {/* Kullanım Alanı */}
                            <TableHead className="px-4">Kullanıldığı Endüstriyel Ürün</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, index) => (
                            <TableRow key={`${row.sector}-${row.productionGroup}-${row.usageArea}`}>
                                <TableCell className="px-4 text-neutral-500">{index + 1}</TableCell>
                                <TableCell className="px-4 font-medium">{row.sector}</TableCell>
                                <TableCell className="px-4">{row.productionGroup}</TableCell>
                                <TableCell className="px-4">{row.usageArea}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </section>
    )
}
