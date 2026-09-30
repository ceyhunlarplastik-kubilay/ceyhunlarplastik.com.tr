"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MoveRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BoardJob, BoardMachine, PlacementMode } from "@/features/production/board/api/types"
import {
    boardMoveFormDefaults,
    boardMoveFormSchema,
    type BoardMoveFormValues,
} from "@/features/production/board/schema/boardMoveForm"
import { moveVerdict } from "@/features/production/board/utils/boardGeometry"
import { PLACEMENT_MODE_OPTIONS } from "@/features/production/board/utils/placementMessage"

const VERDICT_SUFFIX = { same: " (şu anki)", ok: "", warning: " — uyarı var", unknown: " — veri eksik", error: " — uygun değil" } as const

type Props = {
    job: BoardJob
    machines: BoardMachine[]
    isPending: boolean
    /** Tahtanın çakışma kipi — form da aynısıyla gönderilir. */
    placementMode: PlacementMode
    onSubmit: (values: BoardMoveFormValues) => void
}

/**
 * Sürükle-bırakın klavye alternatifi: hedef makine + en erken bağlama başı. Kalıbın
 * çalışamadığı makineler seçilemez; iş, seçilen andan sonraki ilk uygun boşluğa yerleşir.
 */
export function BoardJobMoveForm({ job, machines, isPending, placementMode, onSubmit }: Props) {
    const mode = PLACEMENT_MODE_OPTIONS.find((option) => option.value === placementMode)
    const form = useForm<BoardMoveFormValues>({
        resolver: zodResolver(boardMoveFormSchema),
        defaultValues: boardMoveFormDefaults(job),
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 rounded-xl border p-3">
                <h3 className="text-sm font-semibold">Taşı</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="machineId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Makine</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {machines.map((machine) => {
                                            const { verdict } = moveVerdict(job, machine.id)
                                            return (
                                                <SelectItem key={machine.id} value={machine.id} disabled={verdict === "error"}>
                                                    {machine.code} · {machine.name}{VERDICT_SUFFIX[verdict]}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="startAt"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>En erken başlangıç</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" step={900} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormDescription>
                    Fabrika saatiyle. Çakışmada: {mode?.label.toLocaleLowerCase("tr-TR")} — {mode?.hint} Plan seçilen makinenin çevrim ve verimiyle yeniden hesaplanır.
                </FormDescription>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        <MoveRight className="h-4 w-4" />
                        Taşı
                    </Button>
                </div>
            </form>
        </Form>
    )
}
