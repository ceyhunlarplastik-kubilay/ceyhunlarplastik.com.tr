"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
    BookMarked,
    Boxes,
    BadgePercent,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    LayoutDashboard,
    Menu,
    PackageCheck,
    PackageSearch,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { AdminUserMenu } from "@/components/admin/AdminUserMenu"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const items = [
    { href: "/musteri", label: "Müşteri Profili", icon: LayoutDashboard },
    /* { href: "/musteri/profil", label: "Profil / Firma Bilgileri", icon: Building2 }, */
    { href: "/musteri/tanimli-urunler", label: "İlgili Ürün Modelleri", icon: BookMarked },
    { href: "/musteri/musteriye-tanimli-urunler", label: "Tanımlı Varyantlar", icon: Boxes },
    { href: "/musteri/ozel-fiyatli-urunler", label: "Özel Fiyatlı Ürünler ve Talepler", icon: BadgePercent },
    { href: "/musteri/tum-urunler", label: "Tüm Ürünler", icon: PackageSearch },
    { href: "/musteri/siparisler", label: "Siparişler ve Talepler", icon: PackageCheck },
    { href: "/musteri/talepler", label: "Tüm Talepler", icon: ClipboardList },
]

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

function TurkishCalendarCard() {
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

function NavItem({
    href,
    label,
    icon: Icon,
    collapsed,
    onNavigate,
}: {
    href: string
    label: string
    icon: LucideIcon
    collapsed: boolean
    onNavigate?: () => void
}) {
    const pathname = usePathname()
    const isActive = href === "/musteri" ? pathname === href : pathname.startsWith(href)

    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all",
                isActive
                    ? "bg-brand text-white shadow-md"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            )}
        >
            <Icon className="h-5 w-5 shrink-0" />

            <AnimatePresence>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="whitespace-nowrap"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
        </Link>
    )
}

type Props = {
    name?: string | null
    email?: string | null
    image?: string | null
    groups?: string[]
}

export function CustomerPortalSidebar({
    name,
    email,
    image,
    groups = [],
}: Props) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const activeItem = useMemo(
        () => items.find((item) => item.href === "/musteri" ? pathname === item.href : pathname.startsWith(item.href)),
        [pathname]
    )

    return (
        <>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur-xl md:hidden">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-700 shadow-sm"
                        aria-label="Navigasyonu aç"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="min-w-0 space-y-0.5">
                        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-400">Ceyhunlar</div>
                        <h2 className="truncate text-sm font-semibold text-neutral-900">
                            {activeItem?.label ?? "Müşteri Paneli"}
                        </h2>
                    </div>
                </div>

                <AdminUserMenu
                    name={name}
                    email={email}
                    image={image}
                    groups={groups}
                />
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.button
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] md:hidden"
                            aria-label="Menüyü kapat"
                        />

                        <motion.aside
                            initial={{ x: -320, opacity: 0.92 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -320, opacity: 0.92 }}
                            transition={{ type: "spring", stiffness: 220, damping: 28 }}
                            className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col border-r border-neutral-200 bg-white p-4 shadow-2xl md:hidden"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">Ceyhunlar</div>
                                    <div className="text-base font-semibold text-neutral-900">Müşteri Menüsü</div>
                                </div>

                                <button
                                    className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-700 shadow-sm"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                            </div>

                            <nav className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
                                {items.map((item) => (
                                    <NavItem
                                        key={item.href}
                                        {...item}
                                        collapsed={false}
                                        onNavigate={() => setMobileOpen(false)}
                                    />
                                ))}
                            </nav>

                            {/*                             <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                                    Hızlı Talep
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    {quickRequestItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div> */}

                            <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
                                Portal ekranları mobil kullanım için sadeleştirildi ve hızlı erişim odaklı düzenlendi.
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <motion.aside
                animate={{ width: collapsed ? 84 : 280 }}
                className="hidden md:flex md:flex-col md:gap-6 md:border-r md:bg-white md:p-4"
            >
                <div className="flex items-center justify-between">
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-0.5"
                            >
                                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">Ceyhunlar</div>
                                <div className="text-lg font-semibold text-neutral-900">Müşteri Paneli</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => setCollapsed((value) => !value)}
                        className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-700 transition hover:bg-neutral-50"
                        aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
                    >
                        <ChevronLeft className={cn("transition", collapsed && "rotate-180")} />
                    </button>
                </div>

                <nav className="flex flex-col gap-2">
                    {items.map((item) => (
                        <NavItem
                            key={item.href}
                            {...item}
                            collapsed={collapsed}
                        />
                    ))}
                </nav>

                {/* <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                        >
                            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                                Hızlı Talep
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {quickRequestItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence> */}

                <AnimatePresence>
                    {!collapsed && (
                        <TurkishCalendarCard />
                    )}
                </AnimatePresence>

                <div className="mt-auto text-xs text-neutral-400">
                    {!collapsed && "Ceyhunlar Customer Portal"}
                </div>
            </motion.aside>
        </>
    )
}
