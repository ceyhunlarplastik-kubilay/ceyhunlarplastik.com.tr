export type UserNameLike = {
    firstName?: string | null
    lastName?: string | null
    identifier?: string | null
    email?: string | null
}

export function buildUserDisplayName(user: UserNameLike | null | undefined) {
    if (!user) return ""

    const fullName = [user.firstName, user.lastName]
        .map((value) => value?.trim())
        .filter(Boolean)
        .join(" ")

    if (fullName) return fullName
    if (user.identifier?.trim()) return user.identifier.trim()
    if (user.email?.trim()) return user.email.trim().split("@")[0] ?? user.email.trim()
    return ""
}
