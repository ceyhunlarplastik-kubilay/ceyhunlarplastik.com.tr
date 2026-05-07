"use client"

import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/interfaces-input-otp"

type Props<TFieldValues extends FieldValues> = {
    control: Control<TFieldValues>
    name: FieldPath<TFieldValues>
    label: string
    description?: string
    disabled?: boolean
    maxLength?: number
}

export function AuthOtpField<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    description,
    disabled,
    maxLength = 6,
}: Props<TFieldValues>) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <InputOTP
                            maxLength={maxLength}
                            value={typeof field.value === "string" ? field.value : ""}
                            onChange={field.onChange}
                            disabled={disabled}
                            containerClassName="justify-between gap-2"
                            className="w-full"
                            pattern="[0-9A-Za-z]*"
                        >
                            <InputOTPGroup className="grid w-full grid-cols-6 gap-2">
                                {Array.from({ length: maxLength }).map((_, index) => (
                                    <InputOTPSlot key={index} index={index} />
                                ))}
                            </InputOTPGroup>
                        </InputOTP>
                    </FormControl>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}
