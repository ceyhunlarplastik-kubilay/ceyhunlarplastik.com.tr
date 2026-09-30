"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    LOT_NOTE_CATEGORIES,
    LOT_NOTE_CATEGORY_LABELS,
    MAX_LOT_NOTE_LENGTH,
} from "@core/helpers/production/productionLots"
import { formatProductionDateTime } from "@core/helpers/production/productionTime"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import type { LotDetail, LotNote } from "@/features/production/lots/api/types"
import { useCreateLotNote, useDeleteLotNote } from "@/features/production/lots/hooks/useProductionLots"
import {
    lotNoteFormDefaults,
    lotNoteFormSchema,
    NO_OPERATOR,
    toLotNoteInput,
    type LotNoteFormValues,
} from "@/features/production/lots/schema/lotNoteForm"
import { useProductionOperators } from "@/features/production/operators/hooks/useProductionOperators"
import { formatOperatorName, sortOperators } from "@/features/production/shared/operators"

const CATEGORY_BADGE_CLASSES = {
    GENERAL: "",
    QUALITY: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    MAINTENANCE: "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    MATERIAL: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
    HANDOVER: "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
} as const

/** Lot notları: planlayıcı yazar; bir operatör adına da girilebilir. En yeni üstte. */
export function LotNotesSection({ lot }: { lot: LotDetail }) {
    const operatorsQuery = useProductionOperators()
    const createMutation = useCreateLotNote(lot.lotNumber)
    const deleteMutation = useDeleteLotNote()
    const form = useForm<LotNoteFormValues>({
        resolver: zodResolver(lotNoteFormSchema),
        defaultValues: lotNoteFormDefaults,
    })
    const bodyLength = useWatch({ control: form.control, name: "body" }).length
    // Lotun ekibi önce: not çoğunlukla o vardiyadakilerden birinin aktardığı.
    const teamIds = new Set(lot.operators.list.map((operator) => operator.id))
    const operators = sortOperators(operatorsQuery.data ?? []).sort((a, b) => Number(teamIds.has(b.id)) - Number(teamIds.has(a.id)))

    async function submit(values: LotNoteFormValues) {
        try {
            await createMutation.mutateAsync(toLotNoteInput(values))
            form.reset({ ...lotNoteFormDefaults, category: values.category })
            toast.success("Not eklendi")
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    async function remove(note: LotNote) {
        try {
            await deleteMutation.mutateAsync(note.id)
            toast.success("Not silindi")
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    return (
        <section className="space-y-4 rounded-2xl border p-4">
            <h2 className="text-sm font-semibold">Notlar <span className="font-normal text-muted-foreground">({lot.notes.length})</span></h2>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tür</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {LOT_NOTE_CATEGORIES.map((category) => (
                                                <SelectItem key={category} value={category}>{LOT_NOTE_CATEGORY_LABELS[category]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="operatorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Operatör adına (opsiyonel)</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={NO_OPERATOR}>Yalnız benim notum</SelectItem>
                                            {operators.map((operator) => (
                                                <SelectItem key={operator.id} value={operator.id}>
                                                    {formatOperatorName(operator)}{teamIds.has(operator.id) ? " · ekipte" : ""}{operator.isActive ? "" : " (pasif)"}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="body"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex justify-between">
                                    Not
                                    <span className="font-normal tabular-nums text-muted-foreground">{bodyLength}/{MAX_LOT_NOTE_LENGTH}</span>
                                </FormLabel>
                                <FormControl>
                                    <Textarea rows={3} maxLength={MAX_LOT_NOTE_LENGTH} placeholder="Ör. renk tonu açık, kalıp sıcaklığı 5 °C düşürüldü." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={createMutation.isPending}>
                            <Send className="h-4 w-4" />
                            Notu ekle
                        </Button>
                    </div>
                </form>
            </Form>

            {lot.notes.length > 0 ? (
                <ul className="space-y-2">
                    {lot.notes.map((note) => (
                        <li key={note.id} className="space-y-1.5 rounded-xl border bg-muted/30 p-3">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                <Badge variant="outline" className={`rounded-full ${CATEGORY_BADGE_CLASSES[note.category]}`}>
                                    {LOT_NOTE_CATEGORY_LABELS[note.category]}
                                </Badge>
                                <span className="tabular-nums">{formatProductionDateTime(note.createdAt)}</span>
                                <span>· {note.author ? [note.author.firstName, note.author.lastName].filter(Boolean).join(" ") || "Kullanıcı" : "Silinmiş kullanıcı"}</span>
                                {note.operator ? <span>· {formatOperatorName(note.operator)} adına</span> : null}
                                {note.canDelete ? (
                                    <ConfirmDeleteDialog
                                        trigger={(
                                            <Button type="button" variant="ghost" size="icon" className="ms-auto h-7 w-7" aria-label="Notu sil">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        title="Not silinsin mi?"
                                        description="Not kalıcı olarak silinir."
                                        itemNames={[note.body.length > 60 ? `${note.body.slice(0, 60)}…` : note.body]}
                                        onConfirm={() => void remove(note)}
                                    />
                                ) : null}
                            </div>
                            <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                        </li>
                    ))}
                </ul>
            ) : null}
        </section>
    )
}
