"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

/**
 * Müşteri portalı sidebar'ının takvim kartı. Eskiden 575 satırlık
 * `CustomerPortalSidebar` bileşeninin İÇİNDE yaşıyordu; paneller ortak kabuğa
 * (`PanelShell`) geçerken buraya çıkarıldı ve `sidebarFooterSlot` olarak
 * veriliyor. Portal dışında kullanılmaz — bu yüzden `components/panels` altında
 * değil, portal feature'ında duruyor.
 */

const turkishWeekdays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
const turkishMonths = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
]

function getIstanbulDateParts(value: Date) {
    const parts = new Intl.DateTimeFormat("tr-TR-u-nu-latn", {
        day: "numeric",
        month: "numeric",
        timeZone: "Europe/Istanbul",
        year: "numeric",
    }).formatToParts(value)

    const getPart = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value)

    return {
        day: getPart("day"),
        monthIndex: getPart("month") - 1,
        year: getPart("year"),
    }
}

function buildCalendarDays(year: number, monthIndex: number) {
    const firstDay = new Date(Date.UTC(year, monthIndex, 1))
    const leadingEmptyCells = (firstDay.getUTCDay() + 6) % 7
    const daysInMonth = getDaysInMonth(year, monthIndex)

    return Array.from({ length: leadingEmptyCells + daysInMonth }, (_, index) => {
        const day = index - leadingEmptyCells + 1
        return day > 0 ? day : null
    })
}

function getDaysInMonth(year: number, monthIndex: number) {
    return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

function clampDay(day: number, year: number, monthIndex: number) {
    return Math.min(day, getDaysInMonth(year, monthIndex))
}

function moveMonth(year: number, monthIndex: number, offset: number) {
    const nextMonthDate = new Date(Date.UTC(year, monthIndex + offset, 1))

    return {
        monthIndex: nextMonthDate.getUTCMonth(),
        year: nextMonthDate.getUTCFullYear(),
    }
}

export function CustomerPortalCalendarCard() {
    const today = useMemo(() => new Date(), [])
    const todayParts = useMemo(() => getIstanbulDateParts(today), [today])
    const [selectedDate, setSelectedDate] = useState(todayParts)
    const calendarDays = useMemo(
        () => buildCalendarDays(selectedDate.year, selectedDate.monthIndex),
        [selectedDate.monthIndex, selectedDate.year],
    )
    const dayOptions = useMemo(
        () => Array.from({ length: getDaysInMonth(selectedDate.year, selectedDate.monthIndex) }, (_, index) => index + 1),
        [selectedDate.monthIndex, selectedDate.year],
    )
    const yearOptions = useMemo(() => {
        const startYear = Math.min(todayParts.year - 5, selectedDate.year - 2)
        const endYear = Math.max(todayParts.year + 5, selectedDate.year + 2)

        return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index)
    }, [selectedDate.year, todayParts.year])
    const selectedDateObject = useMemo(
        () => new Date(Date.UTC(selectedDate.year, selectedDate.monthIndex, selectedDate.day)),
        [selectedDate.day, selectedDate.monthIndex, selectedDate.year],
    )
    const selectedDateLabel = useMemo(
        () => new Intl.DateTimeFormat("tr-TR", {
            day: "numeric",
            month: "long",
            timeZone: "Europe/Istanbul",
            weekday: "long",
            year: "numeric",
        }).format(selectedDateObject),
        [selectedDateObject],
    )
    const todayLabel = useMemo(
        () => new Intl.DateTimeFormat("tr-TR", {
            day: "numeric",
            month: "long",
            timeZone: "Europe/Istanbul",
            weekday: "long",
        }).format(today),
        [today],
    )
    const setMonth = (monthIndex: number) => {
        setSelectedDate((current) => ({
            ...current,
            day: clampDay(current.day, current.year, monthIndex),
            monthIndex,
        }))
    }
    const setYear = (year: number) => {
        setSelectedDate((current) => ({
            ...current,
            day: clampDay(current.day, year, current.monthIndex),
            year,
        }))
    }
    const setDay = (day: number) => {
        setSelectedDate((current) => ({
            ...current,
            day,
        }))
    }
    const navigateMonth = (offset: number) => {
        setSelectedDate((current) => {
            const next = moveMonth(current.year, current.monthIndex, offset)

            return {
                ...next,
                day: clampDay(current.day, next.year, next.monthIndex),
            }
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="mt-1 text-sm font-semibold capitalize text-neutral-900">
                        {turkishMonths[selectedDate.monthIndex]} {selectedDate.year}
                    </div>
                </div>
                <div className="rounded-xl border border-brand/15 bg-brand/10 p-2 text-brand">
                    <CalendarDays className="h-4 w-4" />
                </div>
            </div>

            <div className="mt-3 grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="rounded-xl bg-white"
                    onClick={() => navigateMonth(-1)}
                    aria-label="Önceki ay"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select value={String(selectedDate.monthIndex)} onValueChange={(value) => setMonth(Number(value))}>
                    <SelectTrigger className="h-8 min-w-0 rounded-xl bg-white text-xs">
                        <SelectValue placeholder="Ay" />
                    </SelectTrigger>
                    <SelectContent>
                        {turkishMonths.map((month, index) => (
                            <SelectItem key={month} value={String(index)}>
                                {month}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="rounded-xl bg-white"
                    onClick={() => navigateMonth(1)}
                    aria-label="Sonraki ay"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="mt-2 grid grid-cols-2 items-center gap-2">
                <Select value={String(selectedDate.day)} onValueChange={(value) => setDay(Number(value))}>
                    <SelectTrigger className="h-8 min-w-0 rounded-xl bg-white text-xs">
                        <SelectValue placeholder="Gün" />
                    </SelectTrigger>
                    <SelectContent>
                        {dayOptions.map((day) => (
                            <SelectItem key={day} value={String(day)}>
                                {day}. gün
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={String(selectedDate.year)} onValueChange={(value) => setYear(Number(value))}>
                    <SelectTrigger className="h-8 min-w-0 rounded-xl bg-white text-xs">
                        <SelectValue placeholder="Yıl" />
                    </SelectTrigger>
                    <SelectContent>
                        {yearOptions.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="mt-4 grid grid-cols-7 items-center gap-1 text-center">
                {turkishWeekdays.map((day) => (
                    <div key={day} className="flex h-5 items-center justify-center text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                        {day}
                    </div>
                ))}
                {calendarDays.map((day, index) => {
                    const isToday = day === todayParts.day
                        && selectedDate.monthIndex === todayParts.monthIndex
                        && selectedDate.year === todayParts.year
                    const isSelected = day === selectedDate.day

                    return day ? (
                        <button
                            key={`${day}-${index}`}
                            type="button"
                            onClick={() => setDay(day)}
                            className={cn(
                                "relative flex aspect-square items-center justify-center rounded-lg text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35",
                                isSelected
                                    ? "bg-brand text-white shadow-sm"
                                    : "text-neutral-600 hover:bg-white hover:text-neutral-950",
                                isToday && !isSelected && "border border-brand/30 bg-brand/10 text-brand shadow-sm shadow-brand/10",
                            )}
                            aria-current={isToday ? "date" : undefined}
                            aria-pressed={isSelected}
                            aria-label={`${day} ${turkishMonths[selectedDate.monthIndex]} ${selectedDate.year}`}
                        >
                            <span className="leading-none">{day}</span>
                            {isToday ? (
                                <span
                                    className={cn(
                                        "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                                        isSelected ? "bg-white" : "bg-brand",
                                    )}
                                    aria-hidden="true"
                                />
                            ) : null}
                        </button>
                    ) : (
                        <div
                            key={`empty-${index}`}
                            className="aspect-square"
                            aria-hidden="true"
                        />
                    )
                })}
            </div>

            <div className="mt-3 space-y-2">
                <div className="rounded-xl border border-brand/15 bg-white px-3 py-2 text-xs text-neutral-600">
                    <span className="font-semibold text-neutral-900">Seçili:</span>{" "}
                    <span className="capitalize">{selectedDateLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600">
                    <span>
                        <span className="font-semibold text-neutral-900">Bugün:</span>{" "}
                        <span className="capitalize">{todayLabel}</span>
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setSelectedDate(todayParts)}
                    >
                        Bugün
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}
