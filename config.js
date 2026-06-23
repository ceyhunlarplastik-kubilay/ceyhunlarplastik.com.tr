const getConfig = () => {
    return {
        AWS_REGION: process.env.AWS_REGION,
        HOSTED_ZONE_ID: process.env.HOSTED_ZONE_ID,
        DOMAIN: process.env.DOMAIN,
        DOMAIN_CERTIFICATE_ARN: process.env.DOMAIN_CERTIFICATE_ARN,
        RDS_PASSWORD: process.env.RDS_PASSWORD,
        GMAIL_SMTP_USER: process.env.GMAIL_SMTP_USER,
        GMAIL_SMTP_APP_PASSWORD: process.env.GMAIL_SMTP_APP_PASSWORD,
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
        DOMAIN_CERTIFICATE_ARN: config.DOMAIN_CERTIFICATE_ARN ?? "",
        RDS_PASSWORD: config.RDS_PASSWORD ?? "",
        GMAIL_SMTP_USER: config.GMAIL_SMTP_USER ?? "",
        GMAIL_SMTP_APP_PASSWORD: config.GMAIL_SMTP_APP_PASSWORD ?? "",
    };
};
const config = getConfig();
const sanitizedConfig = getSanitizedConfig(config);
export default sanitizedConfig;
