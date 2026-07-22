interface ENV {
    AWS_REGION: string | undefined;
    HOSTED_ZONE_ID: string | undefined;
    DOMAIN: string | undefined;
    DOMAIN_CERTIFICATE_ARN: string | undefined;
    RDS_PASSWORD: string | undefined;
    GMAIL_SMTP_USER: string | undefined;
    GMAIL_SMTP_APP_PASSWORD: string | undefined;
    DIRECT_RDS_HOST: string | undefined;
}

interface Config {
    AWS_REGION: string;
    HOSTED_ZONE_ID: string;
    DOMAIN: string;
    DOMAIN_CERTIFICATE_ARN: string;
    RDS_PASSWORD: string;
    GMAIL_SMTP_USER: string;
    GMAIL_SMTP_APP_PASSWORD: string;
    DIRECT_RDS_HOST: string;
}

const getConfig = (): ENV => {
    return {
        AWS_REGION: process.env.AWS_REGION,
        HOSTED_ZONE_ID: process.env.HOSTED_ZONE_ID,
        DOMAIN: process.env.DOMAIN,
        DOMAIN_CERTIFICATE_ARN: process.env.DOMAIN_CERTIFICATE_ARN,
        RDS_PASSWORD: process.env.RDS_PASSWORD,
        GMAIL_SMTP_USER: process.env.GMAIL_SMTP_USER,
        GMAIL_SMTP_APP_PASSWORD: process.env.GMAIL_SMTP_APP_PASSWORD,
        DIRECT_RDS_HOST: process.env.DIRECT_RDS_HOST,
    };
};

const getSanitizedConfig = (config: ENV): Config => {
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
        DIRECT_RDS_HOST: config.DIRECT_RDS_HOST ?? "",
    } as Config;
};

const config = getConfig();

const sanitizedConfig = getSanitizedConfig(config);

export default sanitizedConfig;
