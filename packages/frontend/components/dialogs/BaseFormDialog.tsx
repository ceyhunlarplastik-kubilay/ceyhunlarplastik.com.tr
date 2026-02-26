"use client";

import * as React from "react";
import { toast } from "sonner";
import {
    useForm,
    type UseFormReturn,
    type FieldValues,
    type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { MotionDialog } from "@/components/dialogs/primitives/MotionDialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Form } from "@/components/ui/form";

type BaseFormDialogProps<TFieldValues extends FieldValues> = {
    trigger: React.ReactNode;
    title: string;
    description?: string;

    schema: ZodType<any, any>; // Zod v4 uyumu
    defaultValues: TFieldValues;

    submitLabel?: string;
    children: (form: UseFormReturn<TFieldValues>) => React.ReactNode;

    onSubmitted?: (data: TFieldValues) => void | Promise<void>;
};

export function BaseFormDialog<TFieldValues extends FieldValues>({
    trigger,
    title,
    description,
    schema,
    defaultValues,
    submitLabel = "Gönder",
    children,
    onSubmitted,
}: BaseFormDialogProps<TFieldValues>) {
    const [open, setOpen] = React.useState(false);

    const form = useForm<TFieldValues>({
        resolver: zodResolver(schema as any),
        defaultValues: defaultValues as any,
        mode: "onSubmit",
    });

    const {
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = form;

    // Dialog kapanınca reset
    React.useEffect(() => {
        if (!open) reset(defaultValues);
    }, [open, reset, defaultValues]);

    const onSubmit: SubmitHandler<TFieldValues> = async (data) => {
        const toastId = toast.loading("Gönderiliyor...");

        try {
            await new Promise((r) => setTimeout(r, 1200));
            await onSubmitted?.(data);

            toast.success("Başarıyla gönderildi", { id: toastId });
            setOpen(false);
        } catch {
            toast.error("Bir hata oluştu", { id: toastId });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>

            <MotionDialog title={title} description={description}>
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {children(form)}

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-white text-black hover:bg-[var(--color-brand)] hover:text-white"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Spinner className="h-4 w-4" />
                                    Gönderiliyor...
                                </span>
                            ) : (
                                submitLabel
                            )}
                        </Button>
                    </form>
                </Form>
            </MotionDialog>
        </Dialog>
    );
}
