"use client"

import { useAttributesForFilter } from "../hooks/useAttributesForFilter"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

type Props = {
    value: string[]
    onChange: (value: string[]) => void
}

export function ProductAttributeSelect({ value, onChange }: Props) {

    const { data, isLoading } = useAttributesForFilter()

    function toggle(valId: string) {
        if (value.includes(valId)) {
            onChange(value.filter(v => v !== valId))
        } else {
            onChange([...value, valId])
        }
    }

    if (isLoading) {
        return <p className="text-sm text-neutral-500">Yükleniyor...</p>
    }

    if (!data?.length) {
        return <p className="text-sm text-neutral-500">Attribute bulunamadı</p>
    }

    return (
        <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-6">

                {data.map(attribute => (

                    <div key={attribute.id} className="space-y-2">

                        {/* ATTRIBUTE TITLE */}
                        <div className="text-sm font-semibold text-neutral-800">
                            {attribute.name}
                        </div>

                        {/* VALUES */}
                        <div className="grid grid-cols-2 gap-2">

                            {attribute.values.map(val => {

                                const checked = value.includes(val.id)

                                return (
                                    <Label
                                        key={val.id}
                                        className="flex items-center gap-2 border rounded-lg px-2 py-1.5 cursor-pointer hover:bg-neutral-50"
                                    >
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={() => toggle(val.id)}
                                        />
                                        <span className="text-sm">
                                            {val.name}
                                        </span>
                                    </Label>
                                )
                            })}

                        </div>
                    </div>

                ))}

            </div>
        </ScrollArea>
    )
}