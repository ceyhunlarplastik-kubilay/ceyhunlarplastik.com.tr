import { Asset, AssetRole } from "@/features/public/assets/types";

export function getAssetByRole(
    assets: Asset[] | undefined,
    role: AssetRole
) {
    return assets?.find(a => a.role === role)
}