"use client"

import type { Asset } from "@/features/public/assets/types"
import type { AssetRole } from "@/features/public/assets/types"

type Props = {
    assetsByRole: Map<AssetRole, Asset[]>
    activeRole: AssetRole
    setActiveRole: (role: AssetRole) => void
}

const roles: AssetRole[] = [
    "PRIMARY",
    "ANIMATION",
    "GALLERY",
    "DOCUMENT",
    "TECHNICAL_DRAWING",
    "MODEL_3D",
    "ASSEMBLY_VIDEO",
    "CERTIFICATE"
]

export function AssetRoleTabs({
    assetsByRole,
    activeRole,
    setActiveRole
}: Props) {

    return (
        <div className="flex gap-2 flex-wrap">
            {roles.map(role => {
                const count = assetsByRole.get(role)?.length ?? 0

                return (

                    <button
                        type="button"
                        key={role}
                        onClick={() => setActiveRole(role)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition 
                        ${activeRole === role
                                ? "bg-black text-white border-black"
                                : "bg-white hover:bg-neutral-50"
                            }`}
                    >
                        {role}
                        {count > 0 && (
                            <span className="ml-2 text-xs opacity-70">
                                ({count})
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
