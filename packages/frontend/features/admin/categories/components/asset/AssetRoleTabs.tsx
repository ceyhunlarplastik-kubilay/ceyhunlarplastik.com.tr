"use client";

import type { Asset, AssetRole } from "@/features/public/assets/types";

type Props = {
    assetsByRole: Map<AssetRole, Asset[]>;
    activeRole: AssetRole;
    setActiveRole: (role: AssetRole) => void;
};

const ROLES: AssetRole[] = [
    "PRIMARY",
    "ANIMATION",
    "GALLERY",
    "DOCUMENT",
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
];

export function AssetRoleTabs({
    assetsByRole,
    activeRole,
    setActiveRole,
}: Props) {

    return (
        <div className="flex flex-wrap gap-2">

            {ROLES.map((role) => {

                const count = assetsByRole.get(role)?.length ?? 0;

                return (
                    <button
                        key={role}
                        onClick={() => setActiveRole(role)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition
              ${activeRole === role
                                ? "bg-black text-white"
                                : "bg-white hover:bg-neutral-100"}
            `}
                    >
                        {role} ({count})
                    </button>
                );
            })}

        </div>
    );
}