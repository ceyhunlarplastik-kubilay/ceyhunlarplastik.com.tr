import { redirect } from "next/navigation"

export default async function SalesCustomerPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    redirect(`/satis/musteriler/${id}/products`)
}
