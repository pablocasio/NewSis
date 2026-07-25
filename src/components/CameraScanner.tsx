"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

const REGION_ID = "camera-scanner-region";

/**
 * Escaneo de código de barras usando la cámara del celular/tablet
 * (útil para el administrador cuando no tiene un lector USB a mano).
 * Usa html5-qrcode, que funciona en Chrome/Android y Safari/iOS modernos.
 */
export default function CameraScanner({ onScan }: { onScan: (codigo: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!abierto) return;

    let activo = true;
    setError("");

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (!activo) return;
      const scanner = new Html5Qrcode(REGION_ID);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            onScan(decodedText);
            cerrar();
          },
          () => {
            /* frames sin código detectado: se ignora */
          }
        )
        .catch(() => setError("No se pudo acceder a la cámara. Revisa los permisos del navegador."));
    });

    return () => {
      activo = false;
    };
  }, [abierto]);

  function cerrar() {
    const scanner = scannerRef.current;
    if (scanner) {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    }
    setAbierto(false);
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
      >
        <Camera className="h-4 w-4" strokeWidth={1.75} />
        Escanear con cámara
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-gray-800">Escanea el código de barras</p>
              <button onClick={cerrar} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
            <div id={REGION_ID} className="overflow-hidden rounded-xl" />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
