import { useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeResult } from 'html5-qrcode';

interface QrScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

const QrScanner = ({ onScanSuccess, onClose }: QrScannerProps) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            'qr-reader-container', 
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
            },
            false
        );

        const handleSuccess = (decodedText: string, _decodedResult: Html5QrcodeResult) => {
            scanner.clear().catch(error => {
                console.error("Gagal membersihkan scanner.", error);
            });
            onScanSuccess(decodedText);
        };

        const handleError = (_errorMessage: string) => {
        };
        
        scanner.render(handleSuccess, handleError);

        // Fungsi cleanup
        return () => {
            // Cek apakah scanner masih aktif sebelum membersihkan
            if (scanner && scanner.getState()) {
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