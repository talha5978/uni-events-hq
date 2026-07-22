import { useState, useEffect, useRef } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function QrScannerButton() {
	const navigate = useNavigate();
	const [isScanning, setIsScanning] = useState(false);
	const scannerRef = useRef<Html5QrcodeScanner | null>(null);

	const startScanner = async () => {
		try {
			setIsScanning(true);

			// Wait for DOM
			await new Promise((resolve) => setTimeout(resolve, 150));

			const scanner = new Html5QrcodeScanner(
				"qr-reader",
				{
					fps: 10,
					qrbox: { width: 280, height: 280 },
					rememberLastUsedCamera: true,
				},
				false,
			);

			scannerRef.current = scanner;

			scanner.render(
				(decodedText) => {
					scanner.clear();
					setIsScanning(false);
					navigate(`/qr/${decodedText}/view`);
					toast.success("QR Code scanned successfully!");
				},
				(errorMessage) => {
					// Ignore "No QR code found" - it's normal
					if (!errorMessage.includes("No QR code found")) {
						console.warn("Scan error:", errorMessage);
					}
				},
			);
		} catch (error) {
			console.error("Scanner init error:", error);
			toast.error("Failed to start camera. Please allow camera permission.");
			setIsScanning(false);
		}
	};

	const stopScanner = () => {
		if (scannerRef.current) {
			scannerRef.current.clear();
			scannerRef.current = null;
		}
		setIsScanning(false);
	};

	// Cleanup
	useEffect(() => {
		return () => {
			if (scannerRef.current) {
				scannerRef.current.clear();
			}
		};
	}, []);

	return (
		<>
			<Button onClick={startScanner} className="flex items-center gap-2" disabled={isScanning}>
				<Camera className="h-4 w-4" />
				Scan QR Code
			</Button>

			{isScanning && (
				<div className="fixed inset-0 bg-black/95 z-100 flex items-center justify-center p-4">
					<div className="bg-white rounded-3xl p-6 w-full max-w-md">
						<div className="flex justify-between items-center mb-6">
							<h3 className="text-2xl font-semibold">Scan QR Code</h3>
							<Button variant="ghost" size="icon" onClick={stopScanner}>
								<X className="h-6 w-6" />
							</Button>
						</div>

						<div id="qr-reader" className="w-full rounded-2xl overflow-hidden" />

						<p className="text-center text-sm text-muted-foreground mt-6">
							Make sure camera permission is allowed
						</p>
					</div>
				</div>
			)}
		</>
	);
}
