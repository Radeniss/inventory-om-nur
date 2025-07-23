// components/QrScanner.tsx
import { useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeResult } from 'html5-qrcode';

interface QrScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

const QrScanner = ({ onScanSuccess, onClose }: QrScannerProps) => {
    useEffect(() => {
        let scanner: Html5QrcodeScanner;

        const handleSuccess = (decodedText: string, decodedResult: Html5QrcodeResult) => {
            if (scanner) {
                scanner.clear().catch(error => {
                    console.error("Gagal membersihkan scanner.", error);
                });
            }
            onScanSuccess(decodedText);
        };

        const handleError = (errorMessage: string) => {
            // Abaikan error "QR code parse error"
        };

        scanner = new Html5QrcodeScanner(
            'qr-reader-container', 
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
            },
            false
        );

        scanner.render(handleSuccess, handleError);

        return () => {
            if (scanner) {
                scanner.clear().catch(error => {
                    console.error("Gagal membersihkan scanner saat unmount.", error);
                });
            }
        };
    }, [onScanSuccess]);

    return (
        <div>
            <div id="qr-reader-container" className="w-full"></div>
            <button onClick={onClose} className="w-full mt-2 bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600">
                Tutup Scanner
            </button>
        </div>
    );
};

export default QrScanner;