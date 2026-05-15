export function buildAssetUrl(key) {
    const base = process.env.ASSET_PUBLIC_BASE_URL?.replace(/\/$/, "");
    if (!base) {
        throw new Error("ASSET_PUBLIC_BASE_URL is not defined");
    }
    return `${base}/${key}`;
}
