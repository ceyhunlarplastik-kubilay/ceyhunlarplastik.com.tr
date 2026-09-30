"use client"

import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import type { KanbanJob } from "@/features/production/kanban/api/types"
import {
    jobCompletionDefaults,
    jobCompletionFormSchema,
    type JobCompletionFormInput,
    type JobCompletionFormOutput,
} from "@/features/production/kanban/schema/jobCompletionForm"
import { FormNumberField } from "@/features/production/shared/components/FormNumberField"

type Props = {
    job: KanbanJob | null
    isPending: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (job: KanbanJob, values: JobCompletionFormOutput) => void
}

/** Tamamlandı'ya bırakılınca: her göz grubu için sağlam + fire. */
export function JobCompletionDialog({ job, isPending, onOpenChange, onSubmit }: Props) {
    return (
        <Dialog open={Boolean(job)} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(40rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-lg">
                {job ? (
                    // İş değişince form yeni varsayılanlarla kurulur.
                    <CompletionForm key={`${job.id}:${job.version}`} job={job} isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={onSubmit} />
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

function CompletionForm({
    job,
    isPending,
    onCancel,
    onSubmit,
}: {
    job: KanbanJob
    isPending: boolean
    onCancel: () => void
    onSubmit: (job: KanbanJob, values: JobCompletionFormOutput) => void
}) {
    const form = useForm<JobCompletionFormInput, unknown, JobCompletionFormOutput>({
        resolver: zodResolver(jobCompletionFormSchema),
        defaultValues: jobCompletionDefaults(job),
    })
    const { fields } = useFieldArray({ control: form.control, name: "outputs" })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => onSubmit(job, values))} className="flex min-h-0 flex-1 flex-col">
                <DialogHeader className="shrink-0 gap-1.5 border-b px-5 py-4 pe-12 text-start sm:px-6">
                    <DialogTitle>İş {job.lotBaseNumber} tamamlansın mı?</DialogTitle>
                    <DialogDescription>
                        {job.machine.code} · {job.mold.code}. {job.reportedLotCount > 0
                            ? `${job.reportedLotCount}/${job.lotCount} lotun vardiya raporu var; adetler raporların toplamıyla dolu geldi — son sayımı düzeltebilirsiniz.`
                            : "Sahada sayılan sağlam ve fire adetlerini girin."} Tamamlanan iş kapanır ve emir durumu güncellenir.
                    </DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
                    {fields.map((field, index) => {
                        const output = job.outputs[index]
                        return (
                            <fieldset key={field.id} className="space-y-2 rounded-xl border p-3">
                                <legend className="px-1 text-sm font-medium">
                                    {output.sizeCode} · {output.productName}
                                    <span className="font-normal text-muted-foreground">
                                        {" "}— {output.order ? output.order.orderNumber : "yan ürün"} · planlanan {output.plannedQuantity.toLocaleString("tr-TR")}
                                    </span>
                                </legend>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <FormNumberField control={form.control} name={`outputs.${index}.goodQuantity`} label="Sağlam" unit="adet" required />
                                    <FormNumberField control={form.control} name={`outputs.${index}.scrapQuantity`} label="Fire" unit="adet" required />
                                </div>
                            </fieldset>
                        )
                    })}
                </div>
                <DialogFooter className="shrink-0 border-t px-5 py-3 sm:px-6">
                    <Button type="button" variant="outline" onClick={onCancel}>Vazgeç</Button>
                    <Button type="submit" disabled={isPending}>
                        <CheckCircle2 className="h-4 w-4" />
                        Tamamla
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    )
}
