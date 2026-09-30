/**
 * "Sonrakileri kaydır" — SAF modül (yalnız göreli import).
 *
 * İş bırakılan ana yerleşir; aynı makinede O ANDAN SONRA başlayan planlı işler, yerleşen işin
 * arkasına sırayla kaydırılır. Kurallar:
 *  - Yalnız PLANNED işler kayar; sahaya verilmiş / süren iş sabittir (engel sayılır).
 *  - Bırakılan andan ÖNCE başlayan iş kaymaz (bırakılan anla çakışıyorsa yerleşen iş onun
 *    arkasına düşer — "ilk boşluk" gibi).
 *  - Aradaki boşluklar korunur: her iş en erken kendi eski başlangıcında başlar; öndeki iş ona
 *    değmiyorsa yerinde kalır.
 */

export type RippleCandidateJob = { id: string; machineId: string; status: string; setupStartAt: Date }

/** Kaydırılacak işler, eski başlangıca göre sıralı. */
export function selectRippleFollowers<T extends RippleCandidateJob>(
    jobs: T[],
    input: { machineId: string; from: Date; excludeJobId?: string },
): T[] {
    return jobs
        .filter((job) => (
            job.machineId === input.machineId
            && job.status === "PLANNED"
            && job.id !== input.excludeJobId
            && job.setupStartAt.getTime() >= input.from.getTime()
        ))
        .sort((a, b) => a.setupStartAt.getTime() - b.setupStartAt.getTime())
}

/** Kayan işin en erken başlangıcı: eski yeri ile öndeki işin bitişinden büyük olanı. */
export function rippleEarliestStart(originalStart: Date, previousEnd: Date): Date {
    return originalStart.getTime() >= previousEnd.getTime() ? originalStart : previousEnd
}
