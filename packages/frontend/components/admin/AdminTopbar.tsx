import { AdminUserMenu } from "@/components/admin/AdminUserMenu"

type Props = {
    title: string
    subtitle?: string
    name?: string | null
    email?: string | null
    image?: string | null
    groups?: string[]
    actionSlot?: React.ReactNode
}

export function AdminTopbar({
    title,
    subtitle = "Çalışma alanı",
    name,
    email,
    image,
    groups = [],
    actionSlot,
}: Props) {
    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-6 py-4 md:px-8">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
                        {subtitle}
                    </p>
                    <h1 className="truncate text-sm font-semibold text-slate-900 md:text-base">
                        {title}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {actionSlot}
                    <AdminUserMenu
                        name={name}
                        email={email}
                        image={image}
                        groups={groups}
                    />
                </div>
            </div>
        </header>
    )
}
