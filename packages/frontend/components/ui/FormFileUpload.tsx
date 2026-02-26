"use client";

import {
    Controller,
    type Control,
    type FieldValues,
    type Path,
} from "react-hook-form";
import { UploadCloud } from "lucide-react";

import { FormItem, FormControl, FormMessage } from "@/components/ui/form";

type Props<TFieldValues extends FieldValues> = {
    control: Control<TFieldValues>;
    name: Path<TFieldValues>;
    label: string;
    icon?: React.ElementType;
};

export function FormFileUpload<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    icon: Icon = UploadCloud,
}: Props<TFieldValues>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem>
                    <FormControl>
                        <label
                            className={`
                flex flex-col items-center justify-center
                rounded-2xl border-2 border-dashed
                border-neutral-300 bg-neutral-50
                px-6 py-8 text-center cursor-pointer
                transition hover:border-[var(--color-brand)]
              `}
                        >
                            <Icon className="h-8 w-8 text-[var(--color-brand)] mb-3" />

                            <span className="text-base font-medium text-neutral-800">
                                {label}
                            </span>

                            <span className="mt-1 text-sm text-neutral-500">
                                PDF · Maksimum 5MB
                            </span>

                            <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    field.onChange(file);
                                }}
                            />
                        </label>
                    </FormControl>

                    {fieldState.error && <FormMessage />}
                </FormItem>
            )}
        />
    );
}
