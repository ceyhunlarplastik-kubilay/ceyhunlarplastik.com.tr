"use client"

import { Mail, ShieldCheck } from "lucide-react"
import { ProfileDropdown } from "@/components/ui/profile-dropdown"
import { performClientSignOut } from "@/features/auth/lib/client-signout"

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
    if (groups.includes("owner")) return { label: "Owner" }
    if (groups.includes("admin")) return { label: "Admin" }
    if (groups.includes("purchasing")) return { label: "Satın Alma" }
    if (groups.includes("sales")) return { label: "Satış" }
    if (groups.includes("supplier")) return { label: "Tedarikçi" }
    return { label: "User" }
}

async function handleSignOut() {
    await performClientSignOut()
}

export function AdminUserMenu({ name, email, image, groups = [] }: AdminUserMenuProps) {
    const role = getRoleBadge(groups)
    const displayName = name ?? email ?? "Kullanıcı"

    return (
        <ProfileDropdown
            data={{
                name: displayName,
                email: email ?? "",
                avatar: image ?? undefined,
                roleLabel: role.label,
            }}
            menuItems={[
                {
                    label: "Kimlik",
                    value: getInitials(name, email),
                    icon: <Mail className="w-4 h-4" />,
                },
                {
                    label: "Yetki",
                    value: role.label,
                    icon: <ShieldCheck className="w-4 h-4" />,
                },
            ]}
            signOutLabel="Çıkış Yap"
            onSignOut={handleSignOut}
        />
    )
}
