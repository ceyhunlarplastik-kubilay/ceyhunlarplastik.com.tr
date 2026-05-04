import { redirect } from "next/navigation"

export default async function SupplierLayout({
    children,
}: {
    children: React.ReactNode
}) {
    void children
    redirect("/tedarikci")
}
