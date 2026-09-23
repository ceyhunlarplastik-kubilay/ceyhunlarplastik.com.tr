import config from "../config";
import { vpc, rds } from "./db";
import { appRouter } from "./router";

const isPermanentStage = ['prod', 'dev'].includes($app.stage);

// Google ile giriş stage-özel bir BAYRAKtır (`.env` → GOOGLE_LOGIN_ENABLED=true). Kapalıyken
// havuza/client'a hiçbir şey eklenmez; yani prod/dev diff'i boş kalır ve o stage'de Google
// secret'ı tanımlı olmak zorunda değildir (`sst.Secret` eksikse deploy düşer).
const googleLoginEnabled = config.GOOGLE_LOGIN_ENABLED;

// Helper functions
const getFrontendDomain = () => {
    if ($app.stage === 'prod') return config.DOMAIN
    if ($app.stage === 'dev') return `dev.${config.DOMAIN}`
    // if ($app.stage === 'test-1') return $interpolate`${frontend.nodes.cdn?.domainUrl}`
    if ($app.stage === 'test-1') return "d32mxh4ylm3z1k.cloudfront.net"
    return 'localhost:3000'
}

const getBaseUrl = () => (isPermanentStage ? `https://${getFrontendDomain()}` : 'http://localhost:3000')
const getCallbackUrls = () => {
    const base = getBaseUrl()
    return [`${base}/api/auth/callback/cognito`]
}
const getLogoutUrls = () => [
    getBaseUrl(),
    `${getBaseUrl()}/auth/signin`,
]

const folderPrefix = 'packages/functions/src/Cognito/functions';

const userPool = new sst.aws.CognitoUserPool('CeyhunlarUserPool', {
    usernames: ['email'],
    verify: {
        emailSubject: 'Ceyhunlar Plastik - Email Doğrulama',
        emailMessage: 'Kayıt olduğunuz için teşekkür ederiz. Doğrulama kodunuz: {####}. Bu kod 24 saat boyunca geçerlidir.',
    },
    triggers: {
        postConfirmation: {
            handler: `${folderPrefix}/triggers/postConfirmation.handler`,
            runtime: 'nodejs20.x',
            vpc: vpc,
            link: [rds],
        },
        // Federe (Google) ilk girişi yerel profile bağlar — bkz. cognito/federation/*.
        // VPC YOK: yalnız Cognito API'sini çağırır, DB'ye dokunmaz (Cognito trigger'ı 5 sn
        // içinde dönmek zorunda; VPC/NAT gecikmesi eklemeyelim).
        ...(googleLoginEnabled
            ? {
                preSignUp: {
                    handler: `${folderPrefix}/triggers/preSignUp.handler`,
                    runtime: 'nodejs24.x' as const,
                    // Kaynak, havuz ARN'si DEĞİL: havuz bu Lambda'ya, Lambda'nın rolü havuza
                    // bağlanırsa döngüsel bağımlılık oluşur. Bu yüzden hesap+bölge içindeki
                    // tüm havuzlar (`userpool/*`) ile sınırlı tutulur.
                    permissions: [
                        {
                            actions: [
                                'cognito-idp:ListUsers',
                                'cognito-idp:AdminCreateUser',
                                'cognito-idp:AdminSetUserPassword',
                                'cognito-idp:AdminLinkProviderForUser',
                            ],
                            resources: [
                                $interpolate`arn:aws:cognito-idp:${aws.getRegionOutput().name}:${aws.getCallerIdentityOutput().accountId}:userpool/*`,
                            ],
                        },
                    ],
                },
            }
            : {}),
    }
})

const ownerGroup = new aws.cognito.UserGroup('CeyhunlarOwners', {
    userPoolId: userPool.id,
    name: 'owner',
    description: 'Owners users',
    precedence: 1,
});

const adminGroup = new aws.cognito.UserGroup('CeyhunlarAdmins', {
    userPoolId: userPool.id,
    name: 'admin',
    description: 'Admin users',
    precedence: 2,
});

const userGroup = new aws.cognito.UserGroup('CeyhunlarUsers', {
    userPoolId: userPool.id,
    name: 'user',
    description: 'Regular users',
    precedence: 3,
});

const supplierGroup = new aws.cognito.UserGroup('CeyhunlarSuppliers', {
    userPoolId: userPool.id,
    name: 'supplier',
    description: 'Supplier users',
    precedence: 4,
});

const purchasingGroup = new aws.cognito.UserGroup('CeyhunlarPurchasing', {
    userPoolId: userPool.id,
    name: 'purchasing',
    description: 'Purchasing users',
    precedence: 5,
});

const salesGroup = new aws.cognito.UserGroup('CeyhunlarSales', {
    userPoolId: userPool.id,
    name: 'sales',
    description: 'Sales users',
    precedence: 6,
});
const salesDirectorGroup = new aws.cognito.UserGroup('CeyhunlarSalesDirectors', {
    userPoolId: userPool.id,
    name: 'sales_director',
    description: 'Sales director users',
    precedence: 7,
});
const customerGroup = new aws.cognito.UserGroup('CeyhunlarCustomers', {
    userPoolId: userPool.id,
    name: 'customer',
    description: 'Customer portal users',
    precedence: 8,
});
const contentEditorGroup = new aws.cognito.UserGroup('CeyhunlarContentEditors', {
    userPoolId: userPool.id,
    name: 'content_editor',
    description: 'Content and data entry users',
    precedence: 9,
});
void purchasingGroup;
void salesGroup;
void salesDirectorGroup;
void customerGroup;
void contentEditorGroup;

if (isPermanentStage) {
    const hostedZoneId = config.HOSTED_ZONE_ID

    const subdomain = $app.stage === 'prod' ? 'auth' : `auth-${$app.stage}` // exp: auth-dev

    const domainCertificateArn =
        config.DOMAIN_CERTIFICATE_ARN || aws.acm.getCertificate(
            {
                domain: `${config.DOMAIN}`,
                statuses: ['ISSUED'],
                mostRecent: true,
            },
            {
                provider: new aws.Provider('CeyhunlarCognitoUsEast1', { region: 'us-east-1' }),
            },
        ).then(c => c.arn)

    userPool.id.apply(id => {
        const userPoolDomain = new aws.cognito.UserPoolDomain('CeyhunlarUserPoolDomain', {
            domain: `${subdomain}.${config.DOMAIN}`,
            certificateArn: domainCertificateArn,
            userPoolId: id,
        }, {
            dependsOn: appRouter ? [appRouter] : [],
        })

        new aws.route53.Record('auth-cognito-A', {
            name: userPoolDomain.domain,
            type: aws.route53.RecordType.A,
            zoneId: hostedZoneId,
            aliases: [
                {
                    evaluateTargetHealth: false,
                    name: userPoolDomain.cloudfrontDistribution,
                    zoneId: userPoolDomain.cloudfrontDistributionZoneId,
                },
            ],
        })
    })
} else {
    // ✅ Local / preview stage'lerde Hosted UI için Amazon domain prefix oluştur
    userPool.id.apply((id) => {
        new aws.cognito.UserPoolDomain("CeyhunlarUserPoolDomainLocal", {
            userPoolId: id,
            // domain prefix (tam domain değil) — AWS otomatik: https://<prefix>.auth.<region>.amazoncognito.com
            domain: `ceyhunlar-${$app.stage}`,
        });
    });
}

// Google kimlik sağlayıcısı (yalnız GOOGLE_LOGIN_ENABLED=true stage'lerinde).
// - Sağlayıcı ADI Cognito'da rezerve: sosyal sağlayıcı için tam olarak "Google" olmalı.
// - Secret'lar `sst.Secret` (PascalCase) — `npx sst secret set GoogleOAuthClientId --stage <stage>`.
//   Bayrak kapalıyken TANIMLANMAZ: tanımlı ama değersiz secret o stage'in deploy'unu düşürür.
// - `email_verified` map'lenmezse Cognito Google'dan gelen e-postayı doğrulanmamış sayar.
//   Bu eşleme client'ın `writeAttributes`'ına YAZILMAZ: `email_verified` hiçbir app client
//   tarafından yazılabilir bir öznitelik değildir (Cognito `UpdateUserPoolClient`'ı
//   "Invalid write attributes specified" ile reddeder — kubi deploy'unda yaşandı); federe
//   girişte değeri Cognito kendisi yazar. `sst diff` bu kısıtı YAKALAMAZ (yalnız API görür).
const googleProvider = googleLoginEnabled
    ? userPool.addIdentityProvider('Google', {
        type: 'google',
        details: {
            authorize_scopes: 'openid email profile',
            client_id: new sst.Secret('GoogleOAuthClientId').value,
            client_secret: new sst.Secret('GoogleOAuthClientSecret').value,
        },
        attributes: {
            email: 'email',
            email_verified: 'email_verified',
            given_name: 'given_name',
            family_name: 'family_name',
            name: 'name',
            username: 'sub',
        },
    })
    : undefined;

// User Pool Client
const userPoolClient = userPool.addClient('CeyhunlarClient', {
    // Sağlayıcı ADI output olarak verilir: client, sağlayıcıdan SONRA oluşur/güncellenir
    // (Cognito olmayan bir sağlayıcıyı client'a bağlamayı reddeder). Bayrak kapalıyken
    // undefined → SST varsayılanı ["COGNITO"] (önceki değerle aynı, diff yok).
    providers: googleProvider ? ['COGNITO', googleProvider.providerName] : undefined,
    transform: {
        client: {
            allowedOauthFlows: ['code'],
            allowedOauthFlowsUserPoolClient: true,
            allowedOauthScopes: [
                'phone',
                'email',
                'openid',
                'profile',
                // ❌ TEHLİKELİ - Tüm kullanıcıları okuma/yazma yetkisi
                // "aws.cognito.signin.user.admin"
            ],
            callbackUrls: getCallbackUrls(),
            logoutUrls: getLogoutUrls(),
            // generateSecret: false,
            generateSecret: true,
            // `supportedIdentityProviders` BİLİNÇLİ olarak burada yok: yukarıdaki `providers`
            // belirler (transform onu ezerdi ve sağlayıcıdan sonra oluşma sırası bozulurdu).
            readAttributes: [
                'email',
                'phone_number',
                'given_name',
                'family_name',
                'name',
            ],
            writeAttributes: [
                'email',
                'phone_number',
                'given_name',
                'family_name',
                'name',
                // `email_verified` BİLİNÇLİ olarak yok (bkz. yukarıdaki Google IdP notu).
            ],
            explicitAuthFlows: [
                'ALLOW_USER_SRP_AUTH', // Secure Remote Password
                'ALLOW_REFRESH_TOKEN_AUTH',
                'ALLOW_USER_PASSWORD_AUTH',
            ],
            accessTokenValidity: 60,
            idTokenValidity: 60,
            refreshTokenValidity: 30,
            tokenValidityUnits: {
                accessToken: 'minutes',
                idToken: 'minutes',
                refreshToken: 'days',
            },
        },
    },
})

export { userPool, userPoolClient }
