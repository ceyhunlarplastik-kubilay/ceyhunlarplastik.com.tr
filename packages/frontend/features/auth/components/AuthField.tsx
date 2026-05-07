"use client"

import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

type Props<TFieldValues extends FieldValues> = {
    control: Control<TFieldValues>
    name: FieldPath<TFieldValues>
    label: string
    type?: React.ComponentProps<typeof Input>["type"]
    placeholder?: string
    disabled?: boolean
}

export function AuthField<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    type = "text",
    placeholder,
    disabled,
}: Props<TFieldValues>) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input
                            {...field}
                            value={typeof field.value === "string" ? field.value : ""}
                            type={type}
                            placeholder={placeholder}
                            disabled={disabled}
                            className="h-11 rounded-xl border-slate-200 bg-white"
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}
