"use client"

import { useEffect, useState } from "react"
import type { AdminUser } from "@/features/admin/users/api/types"
import {
    DEFAULT_USERS_QUICK_FILTERS,
    persistQuickFilters,
    readPersistedQuickFilters,
    type QuickLinkFilter,
    type QuickRoleFilter,
    type QuickStateFilter,
    type SortDirection,
    type SortKey,
    type UsersQuickFiltersPersisted,
} from "@/features/admin/users/lib/userFilters"
import type { UserAccessDraft } from "@/features/admin/users/lib/userDrafts"

export function useUsersPageState() {
    const [draftsByUserId, setDraftsByUserId] = useState<Record<string, UserAccessDraft>>({})
    const [savingUserId, setSavingUserId] = useState<string | null>(null)
    const [detailsUser, setDetailsUser] = useState<AdminUser | null>(null)
    const [accessEditorUser, setAccessEditorUser] = useState<AdminUser | null>(null)
    const [profileEditorUser, setProfileEditorUser] = useState<AdminUser | null>(null)
    const [deleteUserCandidate, setDeleteUserCandidate] = useState<AdminUser | null>(null)
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [comparisonOpen, setComparisonOpen] = useState(false)
    const [persistedQuickFilters] = useState<UsersQuickFiltersPersisted>(() => readPersistedQuickFilters())
    const [quickRole, setQuickRole] = useState<QuickRoleFilter>(persistedQuickFilters.quickRole)
    const [quickLink, setQuickLink] = useState<QuickLinkFilter>(persistedQuickFilters.quickLink)
    const [quickState, setQuickState] = useState<QuickStateFilter>(persistedQuickFilters.quickState)
    const [sortKey, setSortKey] = useState<SortKey>(persistedQuickFilters.sortKey)
    const [sortDirection, setSortDirection] = useState<SortDirection>(persistedQuickFilters.sortDirection)

    useEffect(() => {
        persistQuickFilters({
            quickRole,
            quickLink,
            quickState,
            sortKey,
            sortDirection,
        })
    }, [quickLink, quickRole, quickState, sortDirection, sortKey])

    function patchDraft(userId: string, patch: UserAccessDraft) {
        setDraftsByUserId((prev) => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                ...patch,
            },
        }))
    }

    function clearDraft(userId: string) {
        setDraftsByUserId((prev) => {
            if (!prev[userId]) return prev
            const next = { ...prev }
            delete next[userId]
            return next
        })
    }

    function toggleSelected(userId: string) {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        )
    }

    function resetQuickControls() {
        setQuickRole(DEFAULT_USERS_QUICK_FILTERS.quickRole)
        setQuickLink(DEFAULT_USERS_QUICK_FILTERS.quickLink)
        setQuickState(DEFAULT_USERS_QUICK_FILTERS.quickState)
        setSortKey(DEFAULT_USERS_QUICK_FILTERS.sortKey)
        setSortDirection(DEFAULT_USERS_QUICK_FILTERS.sortDirection)
    }

    return {
        draftsByUserId,
        savingUserId,
        setSavingUserId,
        detailsUser,
        setDetailsUser,
        accessEditorUser,
        setAccessEditorUser,
        profileEditorUser,
        setProfileEditorUser,
        deleteUserCandidate,
        setDeleteUserCandidate,
        selectedUserIds,
        setSelectedUserIds,
        comparisonOpen,
        setComparisonOpen,
        quickRole,
        setQuickRole,
        quickLink,
        setQuickLink,
        quickState,
        setQuickState,
        sortKey,
        setSortKey,
        sortDirection,
        setSortDirection,
        patchDraft,
        clearDraft,
        toggleSelected,
        resetQuickControls,
    }
}
