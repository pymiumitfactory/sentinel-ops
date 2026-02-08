import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { XIcon } from './Icons';
import type { Asset } from '../types';

interface QRScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (assetId: string) => void;
    assets: Asset[]; // To validate scanned ID against known assets
}

export const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan, assets }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');
    // Fix: Explicitly initialize useRef with undefined to avoid TS2554
    const requestRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const constraints = {
                video: { facingMode: 'environment' } // Rear camera preferred
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                // Wait for metadata to load to know dimensions
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    scanFrame();
                };
            }
            setError('');
        } catch (err) {
            console.error(err);
            setError('No se pudo acceder a la cámara. Revisa los permisos.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (requestRef.current !== undefined) {
            cancelAnimationFrame(requestRef.current);
        }
    };

    const scanFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code) {
                    console.log("QR Found:", code.data);
                    // Check if QR matches an asset ID or Internal ID
                    const foundAsset = assets.find(a => a.id === code.data || a.internalId === code.data);

                    if (foundAsset) {
                        // Success! Beep or Vibrate
                        if (navigator.vibrate) navigator.vibrate(200);
                        onScan(foundAsset.id); // Triggers parent action
                        onClose();
                        return; // Stop scanning loop
                    }
                }
            }
        }
        requestRef.current = requestAnimationFrame(scanFrame);
    };

    if (!isOpen) return null;

    return (
        <div className="scanner-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'black', zIndex: 3000, display: 'flex', flexDirection: 'column'
        }}>
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, width: '100%', zIndex: 3001 }}>
                <h3 style={{ margin: 0, color: 'white' }}>Escanear QR de Activo</h3>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white' }}>
                    <XIcon size={24} />
                </button>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {error ? (
                    <p style={{ color: 'var(--status-down)', padding: '2rem', textAlign: 'center' }}>{error}</p>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            playsInline
                            muted
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        {/* Scanning Overlay (Target Box) */}
                        <div style={{
                            position: 'absolute',
                            width: '250px',
                            height: '250px',
                            border: '2px solid var(--safety-yellow)',
                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                            borderRadius: '16px'
                        }}>
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: '100%', textAlign: 'center', color: 'white', textShadow: '0 1px 2px black'
                            }}>
                                Encuadra el código QR
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
