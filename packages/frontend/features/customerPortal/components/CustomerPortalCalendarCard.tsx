"use client"

import { useState } from "react"
import { tr } from "date-fns/locale"
import { motion } from "motion/react"
import { CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

/**
 * Müşteri portalı sidebar'ının takvim kartı. Eskiden 575 satırlık
 * `CustomerPortalSidebar` bileşeninin İÇİNDE yaşıyordu; paneller ortak kabuğa
 * (`PanelShell`) geçerken buraya çıkarıldı ve `sidebarFooterSlot` olarak
 * veriliyor. Portal dışında kullanılmaz — bu yüzden `components/panels` altında
 * değil, portal feature'ında duruyor.
 *
 * Elle yazılmış ay ızgarası yerine shadcn `Calendar` (react-day-picker) +
 * `date-fns/locale/tr` kullanılıyor — ay/gün adları, sıralama ve erişilebilirlik
 * etiketleri Türkçe locale'den geliyor, elle sürdürülen dizilere gerek kalmadı.
 */
export function CustomerPortalCalendarCard() {
    const today = new Date()
    const [selectedDate, setSelectedDate] = useState<Date>(today)
    const [month, setMonth] = useState<Date>(today)

    const selectedDateLabel = new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        timeZone: "Europe/Istanbul",
        weekday: "long",
        year: "numeric",
    }).format(selectedDate)

    function goToToday() {
        setSelectedDate(today)
        setMonth(today)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    <span className="rounded-xl border border-brand/15 bg-brand/10 p-1.5 text-brand">
                        <CalendarDays className="h-4 w-4" />
                    </span>
                    Takvim
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={goToToday}>
                    Bugün
                </Button>
            </div>

            <Calendar
                mode="single"
                locale={tr}
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={month}
                onMonthChange={setMonth}
                showOutsideDays={false}
                className="mt-2 w-full bg-transparent p-0"
                classNames={{
                    month: "w-full gap-3",
                    month_grid: "w-full",
                }}
            />

            <div className="mt-3 rounded-xl border border-brand/15 bg-white px-3 py-2 text-xs text-neutral-600">
                <span className="font-semibold text-neutral-900">Seçili:</span>{" "}
                <span className="capitalize">{selectedDateLabel}</span>
            </div>
        </motion.div>
    )
}
