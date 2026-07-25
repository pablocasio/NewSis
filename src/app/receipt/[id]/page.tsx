import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/PrintButton";

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { formato?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) return null; // el middleware ya protege esta ruta

  const venta = await prisma.sale.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } }, user: true },
  });
  if (!venta) return notFound();

  const settings = await prisma.settings.findFirst();
  const nombreNegocio = settings?.nombreNegocio || "Mi Negocio";
  const termica = searchParams?.formato === "termica";

  return (
    <div className={termica ? "max-w-[80mm] mx-auto p-2 font-mono text-xs" : "max-w-2xl mx-auto p-8"}>
      <style
        dangerouslySetInnerHTML={{
          __html: termica
            ? "@media print { @page { size: 80mm auto; margin: 0; } }"
            : "@media print { @page { size: A4; margin: 2cm; } }",
        }}
      />

      <div className="no-print flex items-center justify-between mb-6 gap-2">
        <div className="flex gap-2 text-sm">
          <a
            href="?formato=normal"
            className={`px-2 py-1 border rounded ${!termica ? "bg-gray-200" : ""}`}
          >
            Normal
          </a>
          <a
            href="?formato=termica"
            className={`px-2 py-1 border rounded ${termica ? "bg-gray-200" : ""}`}
          >
            Térmica
          </a>
        </div>
        <PrintButton />
      </div>

      <div className="text-center mb-4">
        <p className={termica ? "font-bold" : "font-bold text-xl"}>{nombreNegocio}</p>
        <p>Comprobante de venta</p>
        <p className="text-gray-500">
          {new Date(venta.createdAt).toLocaleString("es-PE")}
        </p>
        <p className="text-gray-400 text-[10px]">
          Documento interno — no válido para efectos tributarios
        </p>
      </div>

      <div className={termica ? "border-t border-b border-dashed py-2 my-2" : "border-t border-b py-3 my-3"}>
        {venta.items.map((it) => (
          <div key={it.id} className="flex justify-between gap-2">
            <span>
              {it.cantidad}x {it.product.nombre}
            </span>
            <span>
              S/ {(it.cantidad * Number(it.precioUnitario) - Number(it.descuento)).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between font-bold mb-2">
        <span>Total</span>
        <span>S/ {Number(venta.total).toFixed(2)}</span>
      </div>

      <p>
        Pago: {venta.metodoPago}
        {venta.metodoPago === "YAPE" && venta.yapeCodigo ? ` (Op. ${venta.yapeCodigo})` : ""}
      </p>
      <p>Atendido por: {venta.user.nombre}</p>

      <p className="text-center mt-6">¡Gracias por su compra!</p>
    </div>
  );
}
