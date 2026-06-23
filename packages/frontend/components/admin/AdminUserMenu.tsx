"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Camera, Loader2, Mail, ShieldCheck, Trash2, UserPen } from "lucide-react"
import { toast } from "sonner"
import { ProfileDropdown } from "@/components/ui/profile-dropdown"
import { performClientSignOut } from "@/features/auth/lib/client-signout"
import { MyProfileDialog } from "@/features/userProfile/components/MyProfileDialog"
import { presignMyProfileImage } from "@/features/userProfile/api/presignMyProfileImage"
import { updateMyProfileImage } from "@/features/userProfile/api/updateMyProfileImage"

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
    if (groups.includes("sales_director")) return { label: "Satış Direktörü" }
    if (groups.includes("sales")) return { label: "Satış" }
    if (groups.includes("content_editor")) return { label: "Veri Girişi" }
    if (groups.includes("supplier")) return { label: "Tedarikçi" }
    if (groups.includes("customer")) return { label: "Müşteri" }
    return { label: "User" }
}

async function handleSignOut() {
    await performClientSignOut()
}

export function AdminUserMenu({ name, email, image, groups = [] }: AdminUserMenuProps) {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [currentImage, setCurrentImage] = useState(image ?? null)
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
    const role = getRoleBadge(groups)
    const displayName = name ?? email ?? "Kullanıcı"

    async function handleSelectProfileImage(file?: File | null) {
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Sadece gorsel dosyalari secilebilir.")
            return
        }

        setIsUploading(true)

        try {
            const presigned = await presignMyProfileImage({
                fileName: file.name,
                contentType: file.type || "image/jpeg",
            })

            await axios.put(presigned.uploadUrl, file, {
                headers: {
                    "Content-Type": file.type || "image/jpeg",
                },
            })

            const updated = await updateMyProfileImage(presigned.key)
            setCurrentImage(updated.imageUrl ?? presigned.url)
            router.refresh()
            toast.success("Profil gorseli guncellendi.")
        } catch (error) {
            console.error(error)
            toast.error("Profil gorseli guncellenemedi.")
        } finally {
            setIsUploading(false)
            if (inputRef.current) {
                inputRef.current.value = ""
            }
        }
    }

    async function handleRemoveProfileImage() {
        setIsUploading(true)

        try {
            await updateMyProfileImage(null)
            setCurrentImage(null)
            router.refresh()
            toast.success("Profil gorseli kaldirildi.")
        } catch (error) {
            console.error(error)
            toast.error("Profil gorseli kaldirilamadi.")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleSelectProfileImage(event.target.files?.[0])}
            />

            <ProfileDropdown
                data={{
                    name: displayName,
                    email: email ?? "",
                    avatar: currentImage ?? undefined,
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
                    {
                        label: "Profili Düzenle",
                        icon: <UserPen className="w-4 h-4" />,
                        onSelect: () => setIsProfileDialogOpen(true),
                    },
                    {
                        label: isUploading ? "Yukleniyor" : "Profil Gorseli",
                        value: currentImage ? "Degistir" : "Yukle",
                        icon: isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />,
                        onSelect: () => {
                            if (!isUploading) {
                                inputRef.current?.click()
                            }
                        },
                    },
                    ...(currentImage ? [{
                        label: "Fotoğrafı Kaldır",
                        icon: <Trash2 className="w-4 h-4" />,
                        onSelect: () => {
                            if (!isUploading) {
                                void handleRemoveProfileImage()
                            }
                        },
                    }] : []),
                ]}
                signOutLabel="Çıkış Yap"
                onSignOut={handleSignOut}
            />

            <MyProfileDialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
        </>
    )
}
