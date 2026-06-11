"use client"

import { useMemo } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { useCustomers } from "@/features/admin/customers/hooks/useCustomers"
import type { Supplier } from "@/features/admin/suppliers/api/types"
import { useSuppliers } from "@/features/admin/suppliers/hooks/useSuppliers"
import type { AdminUser } from "@/features/admin/users/api/types"
import { UserAccessEditorDialog } from "@/features/admin/users/components/UserAccessEditorDialog"
import { UserComparisonDialog } from "@/features/admin/users/components/UserComparisonDialog"
import { UserDetailsDialog } from "@/features/admin/users/components/UserDetailsDialog"
import { UserEditDialog } from "@/features/admin/users/components/UserEditDialog"
import { UsersMobileList } from "@/features/admin/users/components/UsersMobileList"
import { UsersPageHeader } from "@/features/admin/users/components/UsersPageHeader"
import { UsersStatsSummary } from "@/features/admin/users/components/UsersStatsSummary"
import { UsersTable } from "@/features/admin/users/components/UsersTable"
import { UsersToolbar } from "@/features/admin/users/components/UsersToolbar"
import { useUserAccessUpdate } from "@/features/admin/users/hooks/useUserAccessUpdate"
import { useUserListFilters } from "@/features/admin/users/hooks/useUserListFilters"
import { useUsersPageState } from "@/features/admin/users/hooks/useUsersPageState"
import { useUsers } from "@/features/admin/users/hooks/useUsers"
import {
    getUsersStats,
    matchesQuickFilters,
    sortUsers,
} from "@/features/admin/users/lib/userFilters"
import {
    isUserDraftDirty,
    validateUserDraft,
} from "@/features/admin/users/lib/userDrafts"
import {
    buildUserEditorSubmission,
    type CustomerOption,
    type UserEditorFormValues,
} from "@/features/admin/users/schema/userEditor"

const EMPTY_USERS: AdminUser[] = []
const EMPTY_SUPPLIERS: Supplier[] = []
const EMPTY_CUSTOMERS: CustomerOption[] = []

function UsersBulkActions({
    selectedCount,
    dirtySelectedCount,
    compareDisabled,
    onClearSelection,
    onCompare,
    onSaveSelection,
}: {
    selectedCount: number
    dirtySelectedCount: number
    compareDisabled: boolean
    onClearSelection: () => void
    onCompare: () => void
    onSaveSelection: () => void
}) {
    if (selectedCount === 0) return null

    return (
        <div className="flex flex-col gap-3 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-neutral-600">
                <span className="font-semibold text-neutral-950">{selectedCount}</span> kullanıcı seçildi.
                {dirtySelectedCount > 0 ? (
                    <span className="ml-2 text-amber-700">{dirtySelectedCount} taslak değişiklik bekliyor.</span>
                ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={compareDisabled} onClick={onCompare}>
                    Karşılaştır
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onSaveSelection}>
                    Seçilileri Kaydet
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
                    Seçimi Temizle
                </Button>
            </div>
        </div>
    )
}

export function UsersPageClient() {
    const { data: session } = useSession()
    const state = useUsersPageState()
    const updateAccess = useUserAccessUpdate()

    const {
        filters,
        params,
        setSearch,
        setAccessStatus,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
    } = useUserListFilters()

    const userQuery = useUsers({
        params,
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    })
    const supplierQuery = useSuppliers({ params: { page: 1, limit: 500 } })
    const customerQuery = useCustomers({ params: { page: 1, limit: 500 } })

    const users = userQuery.data?.data ?? EMPTY_USERS
    const meta = userQuery.data?.meta
    const suppliers = supplierQuery.data?.data ?? EMPTY_SUPPLIERS
    const customers = customerQuery.data?.data ?? EMPTY_CUSTOMERS
    const isOwnerViewer = (session?.user?.groups ?? []).includes("owner")

    const dirtyCount = useMemo(
        () => users.filter((user) => isUserDraftDirty(user, state.draftsByUserId[user.id])).length,
        [state.draftsByUserId, users],
    )

    const filteredUsers = useMemo(
        () => users.filter((user) =>
            matchesQuickFilters(
                user,
                state.draftsByUserId[user.id],
                state.quickRole,
                state.quickLink,
                state.quickState,
            )),
        [state.draftsByUserId, state.quickLink, state.quickRole, state.quickState, users],
    )

    const visibleUsers = useMemo(
        () => sortUsers(filteredUsers, state.draftsByUserId, state.sortKey, state.sortDirection),
        [filteredUsers, state.draftsByUserId, state.sortDirection, state.sortKey],
    )

    const visibleUserIds = useMemo(
        () => visibleUsers.map((user) => user.id),
        [visibleUsers],
    )

    const activeSelectedUserIds = useMemo(
        () => state.selectedUserIds.filter((id) => visibleUserIds.includes(id)),
        [state.selectedUserIds, visibleUserIds],
    )

    const comparisonUsers = useMemo(
        () => visibleUsers.filter((user) => activeSelectedUserIds.includes(user.id)).slice(0, 2),
        [activeSelectedUserIds, visibleUsers],
    )

    const stats = useMemo(
        () => getUsersStats(visibleUsers, state.draftsByUserId),
        [state.draftsByUserId, visibleUsers],
    )

    const dirtySelectedCount = useMemo(
        () => activeSelectedUserIds.filter((userId) => {
            const user = visibleUsers.find((item) => item.id === userId)
            return user ? isUserDraftDirty(user, state.draftsByUserId[userId]) : false
        }).length,
        [activeSelectedUserIds, state.draftsByUserId, visibleUsers],
    )

    async function handleSave(userId: string) {
        const user = users.find((item) => item.id === userId)
        if (!user) return

        const validationError = validateUserDraft(user, state.draftsByUserId[userId])
        if (validationError) {
            toast.error(validationError)
            return
        }

        try {
            state.setSavingUserId(userId)
            const payload = await updateAccess.saveDraft(user, state.draftsByUserId[userId])
            state.clearDraft(userId)
            if (state.accessEditorUser?.id === userId) {
                state.setAccessEditorUser(null)
            }
            toast.success(payload.roleChanged ? "Rol ve erişim güncellendi." : "Kullanıcı atamaları güncellendi.")
        } catch {
            toast.error("Kullanıcı güncellenemedi.")
        } finally {
            state.setSavingUserId(null)
        }
    }

    async function handleProfileSave(user: AdminUser, values: UserEditorFormValues) {
        const payload = buildUserEditorSubmission(user, values)
        if (!payload.profileChanged && !payload.roleChanged && !payload.assignmentsChanged) {
            toast.message("Güncellenecek bir alan bulunmuyor.")
            state.setProfileEditorUser(null)
            return
        }

        try {
            state.setSavingUserId(user.id)
            const result = await updateAccess.saveEditor(user, values)
            state.clearDraft(user.id)
            state.setProfileEditorUser(null)

            if (result.profileChanged && (result.roleChanged || result.assignmentsChanged)) {
                toast.success("Kullanıcı profili, rolü ve atamaları güncellendi.")
            } else if (result.profileChanged) {
                toast.success("Kullanıcı profili güncellendi.")
            } else if (result.roleChanged) {
                toast.success("Rol ve erişim güncellendi.")
            } else {
                toast.success("Kullanıcı atamaları güncellendi.")
            }
        } catch {
            toast.error("Kullanıcı bilgileri güncellenemedi.")
        } finally {
            state.setSavingUserId(null)
        }
    }

    async function handleSaveSelected() {
        for (const userId of activeSelectedUserIds) {
            const user = visibleUsers.find((item) => item.id === userId)
            if (!user || !isUserDraftDirty(user, state.draftsByUserId[userId])) continue

            const validationError = validateUserDraft(user, state.draftsByUserId[userId])
            if (validationError) {
                toast.error(`${user.email}: ${validationError}`)
                continue
            }

            await handleSave(userId)
        }
    }

    function openAccessEditor(user: AdminUser) {
        state.setDetailsUser(null)
        state.setAccessEditorUser(user)
    }

    function openProfileEditor(user: AdminUser) {
        state.setDetailsUser(null)
        state.setAccessEditorUser(null)
        state.setProfileEditorUser(user)
    }

    return (
        <div className="space-y-6">
            <UsersPageHeader
                totalCount={meta?.total ?? users.length}
                visibleCount={visibleUsers.length}
                dirtyCount={dirtyCount}
                selectedCount={activeSelectedUserIds.length}
            />

            <UsersToolbar
                search={filters.search}
                accessStatus={filters.accessStatus}
                quickRole={state.quickRole}
                quickLink={state.quickLink}
                quickState={state.quickState}
                sortKey={state.sortKey}
                sortDirection={state.sortDirection}
                onSearchChange={setSearch}
                onAccessStatusChange={setAccessStatus}
                onQuickRoleChange={state.setQuickRole}
                onQuickLinkChange={state.setQuickLink}
                onQuickStateChange={state.setQuickState}
                onSortKeyChange={state.setSortKey}
                onSortDirectionToggle={() => state.setSortDirection((prev) => prev === "asc" ? "desc" : "asc")}
                onReset={state.resetQuickControls}
            />

            <AdminListRefreshBar
                dataUpdatedAt={userQuery.dataUpdatedAt}
                isFetching={userQuery.isFetching}
                onRefresh={() => void userQuery.refetch()}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            <UsersStatsSummary visibleCount={visibleUsers.length} stats={stats} />

            <UsersBulkActions
                selectedCount={activeSelectedUserIds.length}
                dirtySelectedCount={dirtySelectedCount}
                compareDisabled={activeSelectedUserIds.length !== 2}
                onClearSelection={() => state.setSelectedUserIds([])}
                onCompare={() => state.setComparisonOpen(true)}
                onSaveSelection={() => void handleSaveSelected()}
            />

            <UsersMobileList
                users={visibleUsers}
                draftsByUserId={state.draftsByUserId}
                suppliers={suppliers}
                customers={customers}
                isLoading={userQuery.isLoading}
                savingUserId={state.savingUserId}
                selectedUserIds={activeSelectedUserIds}
                onToggleSelected={state.toggleSelected}
                onOpenDetails={state.setDetailsUser}
                onOpenAccessEditor={openAccessEditor}
                onSave={(userId) => void handleSave(userId)}
            />

            <UsersTable
                users={visibleUsers}
                draftsByUserId={state.draftsByUserId}
                suppliers={suppliers}
                customers={customers}
                isLoading={userQuery.isLoading}
                savingUserId={state.savingUserId}
                selectedUserIds={activeSelectedUserIds}
                onToggleSelected={state.toggleSelected}
                onOpenDetails={state.setDetailsUser}
                onOpenAccessEditor={openAccessEditor}
                onSave={(userId) => void handleSave(userId)}
            />

            <UserDetailsDialog
                open={Boolean(state.detailsUser)}
                user={state.detailsUser}
                draft={state.detailsUser ? state.draftsByUserId[state.detailsUser.id] : undefined}
                suppliers={suppliers}
                customers={customers}
                onOpenChange={(open) => {
                    if (!open) state.setDetailsUser(null)
                }}
                onOpenAccessEditor={openAccessEditor}
                onOpenProfileEditor={openProfileEditor}
            />

            <UserAccessEditorDialog
                open={Boolean(state.accessEditorUser)}
                user={state.accessEditorUser}
                draft={state.accessEditorUser ? state.draftsByUserId[state.accessEditorUser.id] : undefined}
                suppliers={suppliers}
                customers={customers}
                isOwnerViewer={isOwnerViewer}
                isSaving={state.savingUserId === state.accessEditorUser?.id}
                isLoadingSuppliers={supplierQuery.isLoading}
                isLoadingCustomers={customerQuery.isLoading}
                onOpenChange={(open) => {
                    if (!open) state.setAccessEditorUser(null)
                }}
                onDraftChange={(patch) => {
                    if (!state.accessEditorUser) return
                    state.patchDraft(state.accessEditorUser.id, patch)
                }}
                onClearDraft={() => {
                    if (!state.accessEditorUser) return
                    state.clearDraft(state.accessEditorUser.id)
                }}
                onSave={() => {
                    if (!state.accessEditorUser) return
                    void handleSave(state.accessEditorUser.id)
                }}
                onOpenProfileEditor={openProfileEditor}
            />

            <UserEditDialog
                open={Boolean(state.profileEditorUser)}
                user={state.profileEditorUser}
                suppliers={suppliers}
                customers={customers}
                isOwnerViewer={isOwnerViewer}
                isSaving={state.savingUserId === state.profileEditorUser?.id}
                isLoadingSuppliers={supplierQuery.isLoading}
                isLoadingCustomers={customerQuery.isLoading}
                onOpenChange={(open) => {
                    if (!open) state.setProfileEditorUser(null)
                }}
                onSubmit={handleProfileSave}
            />

            <UserComparisonDialog
                open={state.comparisonOpen}
                onOpenChange={state.setComparisonOpen}
                users={comparisonUsers}
                draftsByUserId={state.draftsByUserId}
                suppliers={suppliers}
                customers={customers}
            />

            <AdminListPagination
                page={meta?.page ?? filters.page}
                totalPages={meta?.totalPages ?? 1}
                total={meta?.total}
                limit={filters.limit}
                itemLabel="kullanıcı"
                onPageChange={setPage}
                onLimitChange={setLimit}
            />
        </div>
    )
}
