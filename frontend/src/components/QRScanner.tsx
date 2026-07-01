import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
  onScanFailure?: (error: any) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, onScanFailure }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isScanning && scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: {width: 250, height: 250}, aspectRatio: 1.0 },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setIsScanning(false);
          onScan(decodedText);
        },
        (error) => {
          if (onScanFailure) {
            onScanFailure(error);
          }
        }
      );

      return () => {
        scanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      };
    }
  }, [isScanning, onScan, onScanFailure]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {!isScanning ? (
        <button
          onClick={() => setIsScanning(true)}
          className="w-full max-w-sm glass-panel border border-blue-500/50 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
        >
          <QrCode className="w-16 h-16 animate-pulse" />
          <span className="font-black uppercase tracking-widest text-lg">Activar Escáner</span>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider max-w-[200px]">
            Presiona para abrir la cámara y escanear el código del manifiesto
          </p>
        </button>
      ) : (
        <div className="w-full max-w-sm glass-panel p-2 rounded-2xl border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] overflow-hidden">
          <div id="reader" ref={scannerRef} className="w-full bg-black rounded-xl overflow-hidden min-h-[300px]">
            {/* html5-qrcode will render the camera view here */}
          </div>
          <button 
            onClick={() => {
              setIsScanning(false);
              if (onClose) onClose();
            }}
            className="w-full mt-4 p-3 border border-red-500/50 text-red-600 dark:text-red-400 font-bold uppercase tracking-widest rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            Cancelar Escaneo
          </button>
        </div>
      )}
    </div>
  );
};
