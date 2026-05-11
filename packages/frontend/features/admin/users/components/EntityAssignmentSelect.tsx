"use client"

import { Check, ChevronDown, Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type Option = {
    id: string
    label: string
    caption?: string
}

type Props = {
    value: string[]
    options: Option[]
    placeholder: string
    emptyLabel?: string
    disabled?: boolean
    onChange: (value: string[]) => void
}

export function EntityAssignmentSelect({
    value,
    options,
    placeholder,
    emptyLabel = "Kayıt bulunamadı",
    disabled = false,
    onChange,
}: Props) {
    const selectedOptions = options.filter((option) => value.includes(option.id))

    function toggle(nextId: string) {
        if (value.includes(nextId)) {
            onChange(value.filter((id) => id !== nextId))
            return
        }

        onChange([...value, nextId])
    }

    return (
        <div className="space-y-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className="h-auto min-h-11 w-full justify-between rounded-xl border-dashed border-neutral-300 px-3 py-2 text-left text-sm text-neutral-700"
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
                            <span className="truncate">
                                {selectedOptions.length > 0
                                    ? `${selectedOptions.length} kayıt seçildi`
                                    : placeholder}
                            </span>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-neutral-200 p-0 shadow-xl" align="start">
                    <Command>
                        <div className="border-b border-neutral-100 px-3 py-3">
                            <CommandInput placeholder="Kayıt ara" className="h-10 rounded-xl border border-neutral-200 bg-white" />
                        </div>

                        <CommandList>
                            <CommandEmpty>{emptyLabel}</CommandEmpty>
                            <CommandGroup className="p-2">
                                <ScrollArea className="h-72 pr-2">
                                    <div className="space-y-1">
                                        {options.map((option) => {
                                            const checked = value.includes(option.id)

                                            return (
                                                <CommandItem
                                                    key={option.id}
                                                    value={`${option.label} ${option.caption ?? ""}`}
                                                    onSelect={() => toggle(option.id)}
                                                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium text-neutral-800">{option.label}</div>
                                                        {option.caption ? (
                                                            <div className="truncate text-xs text-neutral-500">{option.caption}</div>
                                                        ) : null}
                                                    </div>

                                                    <Check className={cn("h-4 w-4 text-brand transition-opacity", checked ? "opacity-100" : "opacity-0")} />
                                                </CommandItem>
                                            )
                                        })}
                                    </div>
                                </ScrollArea>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {selectedOptions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {selectedOptions.map((option) => (
                        <Badge
                            key={option.id}
                            variant="secondary"
                            className="group rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-neutral-700"
                        >
                            <span className="max-w-40 truncate">{option.label}</span>
                            <button
                                type="button"
                                onClick={() => toggle(option.id)}
                                className="ml-2 inline-flex rounded-full text-neutral-400 transition hover:text-neutral-700"
                                aria-label={`${option.label} seçimini kaldır`}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    ))}
                </div>
            ) : null}
        </div>
    )
}
