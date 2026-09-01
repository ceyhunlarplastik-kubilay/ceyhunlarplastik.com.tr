"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type SearchableSelectOption = {
    value: string
    label: string
    /** Etikette geçmeyen ek arama anahtarları (kod, eş anlamlı vb.). */
    keywords?: string
}

type Props = {
    /** Seçili değer; `null` = seçim yok. */
    value: string | null
    onValueChange: (value: string | null) => void
    options: SearchableSelectOption[]
    /** Seçim yokken tetikleyicide ve "tümü" satırında görünen metin. */
    placeholder: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
    loading?: boolean
    /** `null`'a döndüren "tümü / temizle" satırını göster (varsayılan: true). */
    allowClear?: boolean
    /** Tetikleyici (`Button`) className'i. */
    className?: string
    align?: "start" | "center" | "end"
    "aria-label"?: string
}

/**
 * Tek seçimli, aranabilir combobox (shadcn Popover + Command). Uzun listelerde
 * (temsilci, sektör, kullanım alanı, il/ilçe) düz `Select` yerine kullanılır —
 * kullanıcı yazarak filtreleyip zaman kazanır. Çoklu seçim gerekiyorsa
 * `ProductFilterPopoverSelect` desenine bakın.
 */
export function SearchableSelect({
    value,
    onValueChange,
    options,
    placeholder,
    searchPlaceholder,
    emptyText = "Sonuç bulunamadı",
    disabled = false,
    loading = false,
    allowClear = true,
    className,
    align = "start",
    "aria-label": ariaLabel,
}: Props) {
    const [open, setOpen] = useState(false)
    const selected = options.find((option) => option.value === value) ?? null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label={ariaLabel}
                    disabled={disabled}
                    className={cn(
                        "h-11 w-full justify-between rounded-2xl border-neutral-200 bg-white px-3 font-normal text-neutral-900 shadow-none",
                        !selected && "text-neutral-500",
                        disabled && "bg-neutral-100 text-neutral-400",
                        className,
                    )}
                >
                    <span className="truncate">{selected?.label ?? placeholder}</span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-400" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) min-w-60 p-0" align={align}>
                <Command>
                    <CommandInput placeholder={searchPlaceholder ?? placeholder} />
                    <CommandList>
                        <CommandEmpty>{loading ? "Yükleniyor…" : emptyText}</CommandEmpty>
                        <CommandGroup>
                            {allowClear ? (
                                <CommandItem
                                    value="__clear__"
                                    onSelect={() => {
                                        onValueChange(null)
                                        setOpen(false)
                                    }}
                                >
                                    <Check className={cn("h-4 w-4", !selected ? "opacity-100" : "opacity-0")} />
                                    {placeholder}
                                </CommandItem>
                            ) : null}
                            {options.map((option) => (
                                <CommandItem
                                    // cmdk `value` hem eşleşme hem tekillik anahtarı: aynı etiketli
                                    // iki kayıt çakışmasın diye gerçek değeri de ekliyoruz.
                                    key={option.value}
                                    value={`${option.label} ${option.keywords ?? ""} ${option.value}`}
                                    onSelect={() => {
                                        onValueChange(option.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "h-4 w-4",
                                            selected?.value === option.value ? "opacity-100" : "opacity-0",
                                        )}
                                    />
                                    <span className="truncate">{option.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
