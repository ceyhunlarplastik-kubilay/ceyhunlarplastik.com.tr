"use client"

import { signOut } from "next-auth/react"
import { Mail, ShieldCheck } from "lucide-react"
import { ProfileDropdown } from "@/components/ui/profile-dropdown"

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
    // 1) NextAuth cookie/session'ını temizle (redirect:false — biz yönlendireceğiz)
    await signOut({ redirect: false })
    // 2) Cognito hosted UI logout endpoint'ine git (session cookie'yi orada da temizler)
    window.location.href = "/api/auth/signout-cognito"
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
