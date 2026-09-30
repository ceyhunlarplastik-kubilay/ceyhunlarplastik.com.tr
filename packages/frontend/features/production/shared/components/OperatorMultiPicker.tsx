"use client"

import { useState, type ReactNode } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { formatOperatorName, sortOperators, type OperatorLike } from "@/features/production/shared/operators"

type Props = {
    operators: OperatorLike[]
    selectedIds: string[]
    /** Uygula'ya basılınca TAM liste döner (ekip her yerde "tam değişim" olarak yazılır). */
    onApply: (operatorIds: string[]) => void
    trigger: ReactNode
    max: number
    disabled?: boolean
    title?: string
}

/**
 * Ekip seçici (vardiya hücresi, lota özel ekip): aramalı çoklu seçim, "Uygula" ile tek yazım.
 * Pasif operatör yalnız zaten seçiliyse listede görünür (sunucu da aynı kuralı uygular).
 */
export function OperatorMultiPicker({ operators, selectedIds, onApply, trigger, max, disabled = false, title = "Ekip" }: Props) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState<string[]>(selectedIds)

    const visible = sortOperators(operators.filter((operator) => operator.isActive || selectedIds.includes(operator.id)))
    const changed = draft.length !== selectedIds.length || draft.some((id) => !selectedIds.includes(id))

    function toggle(id: string) {
        setDraft((previous) => (previous.includes(id)
            ? previous.filter((entry) => entry !== id)
            : previous.length >= max ? previous : [...previous, id]))
    }

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (next) setDraft(selectedIds)
            }}
        >
            <PopoverTrigger asChild disabled={disabled}>{trigger}</PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Operatör ara" />
                    <CommandList>
                        <CommandEmpty>Operatör bulunamadı.</CommandEmpty>
                        <CommandGroup heading={`${title} · ${draft.length}/${max}`}>
                            {visible.map((operator) => {
                                const selected = draft.includes(operator.id)
                                return (
                                    <CommandItem
                                        key={operator.id}
                                        value={`${formatOperatorName(operator)} ${operator.employeeNo ?? ""}`}
                                        onSelect={() => toggle(operator.id)}
                                        disabled={!selected && draft.length >= max}
                                    >
                                        <Check className={cn("h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                                        <span className="truncate">{formatOperatorName(operator)}</span>
                                        {operator.employeeNo ? <span className="ms-auto text-xs text-muted-foreground">{operator.employeeNo}</span> : null}
                                        {!operator.isActive ? <span className="ms-auto text-xs text-muted-foreground">pasif</span> : null}
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
                <div className="flex items-center justify-between gap-2 border-t p-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDraft([])} disabled={draft.length === 0}>
                        Temizle
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={!changed}
                        onClick={() => {
                            onApply(draft)
                            setOpen(false)
                        }}
                    >
                        Uygula
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
