"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CopyPlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { formatDateKey } from "@core/helpers/production/productionCalendar"
import { useCopyShiftRoster } from "@/features/production/roster/hooks/useShiftRoster"
import { copyRosterDefaults, copyRosterFormSchema, type CopyRosterFormValues } from "@/features/production/roster/schema/copyRosterForm"

/** Görünen günün ekibini seçilen günlere kopyalar; hedef günlerin ekibi tamamen değişir. */
export function CopyRosterDialog({ fromDate }: { fromDate: string }) {
    const [open, setOpen] = useState(false)
    const mutation = useCopyShiftRoster()
    const form = useForm<CopyRosterFormValues>({
        resolver: zodResolver(copyRosterFormSchema(fromDate)),
        defaultValues: copyRosterDefaults(fromDate),
    })

    async function submit(values: CopyRosterFormValues) {
        try {
            const result = await mutation.mutateAsync({ fromDate, ...values })
            toast.success(`${result.days} güne kopyalandı · ${result.created} atama`)
            setOpen(false)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (next) form.reset(copyRosterDefaults(fromDate))
            }}
        >
            <DialogTrigger asChild>
                <Button type="button" variant="outline" className="rounded-2xl">
                    <CopyPlus className="h-4 w-4" />
                    Başka günlere kopyala
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>{formatDateKey(fromDate)} ekibini kopyala</DialogTitle>
                            <DialogDescription>
                                Hedef günlerdeki mevcut ekip SİLİNİR ve bu günün ekibi yazılır. O gün çalışmayan
                                makine / vardiya ve pasif operatörler atlanır.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="toStart"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>İlk gün</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="toEnd"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Son gün</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button>
                            <Button type="submit" disabled={mutation.isPending}>Kopyala</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
