"use client"

import { useState } from "react"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Props = {
    sidebar: React.ReactNode
    children: React.ReactNode
    defaultOpen?: boolean
    className?: string
}

export function DashboardWithCollapsibleSidebar({
    sidebar,
    children,
    defaultOpen = true,
    className,
}: Props) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <div
            className={cn(
                "grid gap-4",
                open ? "lg:grid-cols-[300px_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)]",
                className
            )}
        >
            <aside
                className={cn(
                    "relative rounded-2xl border bg-white p-4 shadow-sm transition-all",
                    open ? "block" : "hidden"
                )}
            >
                <div className={cn(!open && "hidden")}>{sidebar}</div>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute -right-3 top-3 h-7 w-7 rounded-full bg-white"
                    onClick={() => setOpen((prev) => !prev)}
                >
                    {open ? <ChevronsLeft className="h-3.5 w-3.5" /> : <ChevronsRight className="h-3.5 w-3.5" />}
                </Button>
            </aside>

            <section className="relative min-w-0 space-y-4">
                {!open ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mb-2 gap-2"
                        onClick={() => setOpen(true)}
                    >
                        <ChevronsRight className="h-3.5 w-3.5" />
                        Filtreleri Göster
                    </Button>
                ) : null}
                {children}
            </section>
        </div>
    )
}
