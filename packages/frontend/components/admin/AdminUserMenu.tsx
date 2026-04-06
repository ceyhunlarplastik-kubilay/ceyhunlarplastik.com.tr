"use client"

import { signOut } from "next-auth/react"
import { LogOut, User } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

interface AdminUserMenuProps {
    name?: string | null
    email?: string | null
    image?: string | null
    groups?: string[]
}

function getInitials(name?: string | null, email?: string | null): string {
    if (name) {
        const parts = name.trim().split(" ")
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase()
    }
    if (email) {
        return email.slice(0, 2).toUpperCase()
    }
    return "??"
}

function getRoleBadge(groups: string[]) {
    if (groups.includes("owner")) return { label: "Owner", color: "text-amber-600 bg-amber-50" }
    if (groups.includes("admin")) return { label: "Admin", color: "text-blue-600 bg-blue-50" }
    return { label: "User", color: "text-neutral-600 bg-neutral-100" }
}

async function handleSignOut() {
    // 1) NextAuth cookie/session'ını temizle (redirect:false — biz yönlendireceğiz)
    await signOut({ redirect: false })
    // 2) Cognito hosted UI logout endpoint'ine git (session cookie'yi orada da temizler)
    window.location.href = "/api/auth/signout-cognito"
}

export function AdminUserMenu({ name, email, image, groups = [] }: AdminUserMenuProps) {
    const initials = getInitials(name, email)
    const role = getRoleBadge(groups)
    const displayName = name ?? email ?? "Kullanıcı"

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30">
                    <Avatar className="h-8 w-8 border border-neutral-200 shadow-sm">
                        <AvatarImage src={image ?? undefined} alt={displayName} />
                        <AvatarFallback className="bg-brand text-white text-xs font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-neutral-700 hidden lg:block max-w-[120px] truncate">
                        {displayName}
                    </span>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-neutral-900 truncate">
                            {displayName}
                        </p>
                        {email && name && (
                            <p className="text-xs text-neutral-500 truncate">{email}</p>
                        )}
                        <span className={`mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${role.color}`}>
                            {role.label}
                        </span>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    onSelect={handleSignOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıkış yap
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
