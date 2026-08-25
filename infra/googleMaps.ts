import { rds, vpc } from "./db"

const isProd = $app.stage === "prod"

export const googleMapsBrowserApiKey = new sst.Secret("GoogleMapsBrowserApiKey")
export const googleMapsServerApiKey = new sst.Secret("GoogleMapsServerApiKey")
export const googleMapsMapId = new sst.Secret("GoogleMapsMapId")

// Cron YALNIZ prod'da kurulur. Her kişisel stage kendi zamanlanmış işini
// açsaydı aynı Google projesine günde stage sayısı kadar ücretli Place Details
// isteği giderdi; secret tanımlı olmayan stage'lerde de her gün hata veren bir
// Lambda ve gereksiz alarm gürültüsü oluşurdu.
export const googleMapsLocationRefresh = isProd
    ? new sst.aws.Cron("GoogleMapsLocationRefresh", {
        schedule: "cron(30 0 * * ? *)",
        function: {
            handler: "packages/functions/src/GoogleMapsLocationRefresh/actions.handler",
            runtime: "nodejs24.x",
            timeout: "5 minutes",
            vpc,
            link: [rds],
            environment: {
                GOOGLE_MAPS_SERVER_API_KEY: googleMapsServerApiKey.value,
                POWERTOOLS_SERVICE_NAME: "google-maps-location-refresh",
                POWERTOOLS_LOG_LEVEL: "INFO",
            },
        },
    })
    : undefined
