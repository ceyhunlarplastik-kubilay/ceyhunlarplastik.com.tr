"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type MaterialOption = {
    id: string
    name: string
    code?: string | null
}

type Props = {
    materials: MaterialOption[]
    value: string[]
    onChange: (value: string[]) => void
    disabled?: boolean
}

/** Hammadde ÇOKLUDUR: bir versiyon birden fazla hammadde taşıyabilir. */
export function MaterialMultiSelect({ materials, value, onChange, disabled }: Props) {
    const [open, setOpen] = useState(false)
    const selected = materials.filter((material) => value.includes(material.id))

    const toggle = (id: string) => {
        onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id])
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between font-normal"
                >
                    <span className="truncate">
                        {selected.length === 0
                            ? "Seçin"
                            : selected.map((material) => material.code ?? material.name).join(", ")}
                    </span>
                    <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Hammadde ara…" />
                    <CommandList>
                        <CommandEmpty>Hammadde bulunamadı.</CommandEmpty>
                        <CommandGroup>
                            {materials.map((material) => (
                                <CommandItem
                                    key={material.id}
                                    value={`${material.code ?? ""} ${material.name}`}
                                    onSelect={() => toggle(material.id)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 size-4",
                                            value.includes(material.id) ? "opacity-100" : "opacity-0",
                                        )}
                                    />
                                    {material.code ? (
                                        <Badge variant="secondary" className="mr-2 font-mono text-[10px]">
                                            {material.code}
                                        </Badge>
                                    ) : null}
                                    {material.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
