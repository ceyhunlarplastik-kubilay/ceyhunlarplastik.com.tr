"use client";

import { cn } from "@/lib/utils";
import { type Control, type FieldValues, type Path } from "react-hook-form";
import { IMaskInput } from "react-imask";
import type { LucideIcon } from "lucide-react";

import {
    FormItem,
    FormControl,
    FormMessage,
    FormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

type BaseProps<TFieldValues extends FieldValues> = {
    control: Control<TFieldValues>;
    name: Path<TFieldValues>;
    placeholder?: string;
    icon: LucideIcon;
};

type TextInputProps<TFieldValues extends FieldValues> =
    BaseProps<TFieldValues> & {
        type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
        mask?: never;
        textarea?: false;
    };

type MaskedInputProps<TFieldValues extends FieldValues> =
    BaseProps<TFieldValues> & {
        mask: string;
        type?: never;
        textarea?: false;
    };

type TextareaProps<TFieldValues extends FieldValues> =
    BaseProps<TFieldValues> & {
        textarea: true;
        rows?: number;
        mask?: never;
        type?: never;
    };

type FormInputWithIconProps<TFieldValues extends FieldValues> =
    | TextInputProps<TFieldValues>
    | MaskedInputProps<TFieldValues>
    | TextareaProps<TFieldValues>;

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export function FormInputWithIcon<TFieldValues extends FieldValues>(
    props: FormInputWithIconProps<TFieldValues>
) {
    const { control, name, placeholder, icon: Icon } = props;

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => {
                const error = fieldState.error;

                return (
                    <FormItem>
                        <FormControl>
                            <div className="relative">
                                <Icon
                                    className={cn(
                                        "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5",
                                        error ? "text-red-500" : "text-neutral-400"
                                    )}
                                />

                                {"textarea" in props && props.textarea ? (
                                    <Textarea
                                        {...field}
                                        rows={props.rows ?? 4}
                                        placeholder={placeholder}
                                        className="pl-12 pr-4 py-3 rounded-xl border"
                                    />
                                ) : "mask" in props ? (
                                    <IMaskInput
                                        mask={props.mask}
                                        value={field.value ?? ""}
                                        unmask={false}
                                        onAccept={(value) => field.onChange(value)}
                                        placeholder={placeholder ?? props.mask}
                                        className={cn(
                                            "w-full pl-12 pr-4 py-3 rounded-xl border transition outline-none",
                                            error
                                                ? "border-red-500 focus:ring-2 focus:ring-red-500"
                                                : "border-neutral-300 focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)]"
                                        )}
                                    />
                                ) : (
                                    <Input
                                        {...field}
                                        placeholder={placeholder}
                                        type={props.type ?? "text"}
                                        className="pl-12 pr-4 py-3 rounded-xl border"
                                    />
                                )}
                            </div>
                        </FormControl>

                        {/* ✅ ARTIK ÇALIŞIR */}
                        <FormMessage />
                    </FormItem>
                );
            }}
        />
    );
}
