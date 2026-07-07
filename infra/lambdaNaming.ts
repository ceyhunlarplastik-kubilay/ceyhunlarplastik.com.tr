import { createHash } from "crypto";

/**
 * API route Lambda'larına AWS console'da aranabilir fiziksel isimler verir.
 * Örn: ceyhunlarweb-prod-public-products-getProductBySlug-a1b2c
 *
 * Neden transform ile: 212 route'a elle `name:` yazmak yerine her API
 * component'ine tek satır eklenir ve sonradan eklenen route'lar da otomatik
 * isimlenir. Log group adı da bu isimden türediği için CloudWatch'ta da
 * aranabilir hale gelir.
 *
 * Neden hash eki zorunlu: aynı handler birden fazla route'a bağlanabiliyor
 * (ör. ProtectedApi'de decideBusinessRequest 3 route'ta). Hash olmadan
 * isimler çakışır ve deploy ResourceConflictException ile patlar. Hash,
 * route'un logical adından türetildiği için deterministiktir — her deploy'da
 * aynı kalır.
 *
 * DİKKAT — Lambda adı create-only'dir: bu isimlendirme bir route'a İLK kez
 * uygulandığında (veya isim değiştiğinde) o Lambda REPLACE edilir. İsim
 * şemasını değiştirmek tüm API Lambda'larını bir defalık yeniden yaratır;
 * şemayı sabit tutun.
 */
export function apiRouteLambdaNamer(boundary: string) {
    return (
        args: sst.aws.FunctionArgs,
        _opts: unknown,
        logicalName: string,
    ): undefined => {
        // Route kendi `name`'ini verdiyse dokunma.
        if (args.name) return undefined;

        const suffix = createHash("sha256")
            .update(logicalName)
            .digest("hex")
            .slice(0, 5);

        // handler: packages/functions/src/PublicApi/functions/users/actions.getUser
        // -> desc: users-getUser
        let desc = "route";
        if (typeof args.handler === "string") {
            const match = args.handler.match(/functions\/(?:.*\/)?([^/]+)\/actions\.(\w+)$/);
            if (match) desc = `${match[1]}-${match[2]}`;
        }
        desc = desc.replace(/[^a-zA-Z0-9-_]/g, "-");

        // Lambda adı en fazla 64 karakter; "-<hash5>" için 6 karakter ayrılır.
        let base = `${$app.name}-${$app.stage}-${boundary}-${desc}`;
        const maxBase = 64 - 6;
        if (base.length > maxBase) base = base.slice(0, maxBase);

        args.name = `${base}-${suffix}`;
        return undefined;
    };
}
