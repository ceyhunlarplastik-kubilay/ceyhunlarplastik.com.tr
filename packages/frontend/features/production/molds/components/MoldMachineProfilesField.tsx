"use client"

import { useMemo } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { Plus, Trash2, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { findMoldMachineProfileIssues } from "@core/helpers/production/molds"
import type { ProductionMachine } from "@/features/production/machines/api/types"
import {
    emptyMoldMachineProfileRow,
    type MoldFormInput,
    type MoldFormValues,
} from "@/features/production/molds/schema/moldForm"

/**
 * Kalıp + makine kartları: o makinede kanıtlanmış çevrim/bağlama süresi, tercih ya da
 * bilinçli engel ("fiziksel olarak sığsa da bu makinede çalışmaz"). Opsiyonel.
 */
export function MoldMachineProfilesField({ machines }: { machines: ProductionMachine[] }) {
    const form = useFormContext<MoldFormInput, unknown, MoldFormValues>()
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "machineProfiles" })
    const watchedProfiles = useWatch({ control: form.control, name: "machineProfiles" })

    const issues = useMemo(
        () => findMoldMachineProfileIssues((watchedProfiles ?? []).filter((profile) => profile.machineId)),
        [watchedProfiles],
    )

    return (
        <div className="space-y-3">
            {fields.length === 0 ? (
                <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                    Kart yoksa uygunluk yalnız teknik değerlerden hesaplanır. Kalıbın bir makinede kanıtlanmış çevrimi
                    varsa ya da o makinede çalışmaması gerekiyorsa buradan ekleyin.
                </p>
            ) : (
                <ol className="space-y-3">
                    {fields.map((item, index) => (
                        <li key={item.id} className="space-y-3 rounded-2xl border p-3 sm:p-4">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1.4fr)_8rem_8rem]">
                                <FormField
                                    control={form.control}
                                    name={`machineProfiles.${index}.machineId`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 sm:col-span-1">
                                            <FormLabel>Makine</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Makine seçin" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {machines.map((machine) => (
                                                        <SelectItem key={machine.id} value={machine.id}>
                                                            {machine.code} · {machine.name} ({machine.clampForceTon} t)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`machineProfiles.${index}.cycleTimeSec`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Çevrim
                                                <span className="font-normal text-muted-foreground">(sn)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input inputMode="decimal" placeholder="—" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`machineProfiles.${index}.setupMinutes`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Bağlama
                                                <span className="font-normal text-muted-foreground">(dk)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input inputMode="numeric" placeholder="—" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-wrap items-end gap-3">
                                <FormField
                                    control={form.control}
                                    name={`machineProfiles.${index}.isPreferred`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center gap-2">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                                            </FormControl>
                                            <FormLabel className="font-normal">Tercih edilen</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`machineProfiles.${index}.isBlocked`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center gap-2">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                                            </FormControl>
                                            <FormLabel className="font-normal">Bu makinede çalışmaz</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`machineProfiles.${index}.notes`}
                                    render={({ field }) => (
                                        <FormItem className="min-w-48 flex-1">
                                            <FormLabel className="sr-only">Not</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Not (ör. ayar kartı no)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                    Kaldır
                                </Button>
                            </div>
                        </li>
                    ))}
                </ol>
            )}

            <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                disabled={machines.length === 0}
                onClick={() => append(emptyMoldMachineProfileRow())}
            >
                <Plus className="h-4 w-4" />
                Makine kartı ekle
            </Button>

            {issues.length > 0 ? (
                <ul className="space-y-1 text-sm text-destructive">
                    {issues.map((issue) => (
                        <li key={issue} className="flex items-start gap-2">
                            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            {issue}
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    )
}
