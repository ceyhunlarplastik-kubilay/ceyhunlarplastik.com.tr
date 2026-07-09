"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

type Option = {
    id: string
    label: string
    value: string
}

type Props = {
    label: string
    options: Option[]
    selectedValues: string[]
    onToggle: (value: string) => void
}

function getTriggerLabel(
    placeholder: string,
    options: Option[],
    selectedValues: string[]
) {
    if (selectedValues.length === 0) {
        return placeholder
    }

    const selectedOptions = options.filter((option) => selectedValues.includes(option.value))

    if (selectedOptions.length === 1) {
        return selectedOptions[0]?.label ?? placeholder
    }

    if (selectedOptions.length === 2) {
        return selectedOptions.map((option) => option.label).join(", ")
    }

    const [first, second] = selectedOptions
    const extraCount = selectedOptions.length - 2

    return `${first?.label ?? ""}, ${second?.label ?? ""} +${extraCount}`
}

export function ProductFilterPopoverSelect({
    label,
    options,
    selectedValues,
    onToggle,
}: Props) {
    const t = useTranslations("public.productFilter")
    const placeholder = t("selectPlaceholder", { label })
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="h-10 w-full justify-between rounded-xl px-3 text-left text-[13px]"
                >
                    <span className="truncate">
                        {getTriggerLabel(placeholder, options, selectedValues)}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border p-0 shadow-lg"
                align="start"
            >
                <Command>
                    <CommandInput placeholder={t("searchByLabel", { label })} className="text-[13px]" />
                    <CommandList>
                        <CommandEmpty>{t("notFound")}</CommandEmpty>
                        <CommandGroup>
                            <ScrollArea className="h-64">
                                {options.map((option) => {
                                    const checked = selectedValues.includes(option.value)

                                    return (
                                        <CommandItem
                                            key={option.id}
                                            value={`${option.label} ${option.value}`}
                                            onSelect={() => onToggle(option.value)}
                                            className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-1.5"
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Checkbox checked={checked} className="pointer-events-none" />
                                                <span className="truncate text-[13px]">{option.label}</span>
                                            </div>
                                            <Check
                                                className={cn(
                                                    "h-4 w-4 shrink-0 text-[var(--color-brand)] transition-opacity",
                                                    checked ? "opacity-100" : "opacity-0",
                                                )}
                                            />
                                        </CommandItem>
                                    )
                                })}
                            </ScrollArea>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
