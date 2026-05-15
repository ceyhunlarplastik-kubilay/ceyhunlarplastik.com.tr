const getConfig = () => {
    return {
        AWS_REGION: process.env.AWS_REGION,
        HOSTED_ZONE_ID: process.env.HOSTED_ZONE_ID,
        DOMAIN: process.env.DOMAIN,
        RDS_PASSWORD: process.env.RDS_PASSWORD,
    };
};
const getSanitizedConfig = (config) => {
    if (!config.AWS_REGION) {
        throw new Error("Missing key AWS_REGION from environment variables");
    }
    return {
        AWS_REGION: config.AWS_REGION,
        HOSTED_ZONE_ID: config.HOSTED_ZONE_ID ?? "",
        DOMAIN: config.DOMAIN ?? "",
    };
};
const config = getConfig();
const sanitizedConfig = getSanitizedConfig(config);
export default sanitizedConfig;
