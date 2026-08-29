import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './common.jsx';

/**
 * CameraCapture Component
 * Provides camera access and photo capture functionality
 * with preview and AI verification integration
 */
const CameraCapture = ({ onCapture, onClose, isVerifying }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back, 'user' for front

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera is not supported in this browser.');
      } else {
        setError(`Unable to access camera: ${err.message}`);
      }
    }
  }, [facingMode]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    
    return () => {
      // Cleanup: stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Add timestamp watermark
    const timestamp = new Date().toLocaleString();
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(10, canvas.height - 35, ctx.measureText(timestamp).width + 20, 25);
    ctx.fillStyle = '#000';
    ctx.fillText(timestamp, 20, canvas.height - 17);
    
    // Convert to blob
    canvas.toBlob((blob) => {
      const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage({ url: imageUrl, blob });
    }, 'image/jpeg', 0.9);
  }, []);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Toggle camera (front/back)
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setCapturedImage(null);
  }, []);

  // Confirm and send captured photo
  const confirmCapture = useCallback(() => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  // Close camera
  const handleClose = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
        <h2 className="text-white text-lg font-semibold">
          {capturedImage ? 'Review Photo' : 'Capture Photo'}
        </h2>
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-300 transition-colors"
          disabled={isVerifying}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Camera/Preview Area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-6">
            <div className="text-red-500 text-6xl mb-4">📷</div>
            <p className="text-white text-lg mb-4">{error}</p>
            <Button onClick={startCamera} variant="primary">
              Retry Camera Access
            </Button>
          </div>
        ) : capturedImage ? (
          // Show captured image
          <img
            src={capturedImage.url}
            alt="Captured"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          // Show live camera feed
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-h-full max-w-full object-contain"
            />
            {!isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-white">Initializing camera...</p>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* AI Verification Indicator */}
      {isVerifying && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="text-center p-8 bg-gray-800 rounded-2xl max-w-md mx-4">
            <div className="relative w-24 h-24 mx-auto mb-6">
              {/* Spinning AI indicator */}
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">🤖</span>
              </div>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Verifying Image Authenticity</h3>
            <p className="text-gray-400">
              Our AI is analyzing the image to verify it's a real photo...
            </p>
            <div className="mt-4 flex gap-1 justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-900 px-4 py-6">
        {capturedImage ? (
          // Review controls
          <div className="flex justify-center gap-4">
            <Button
              onClick={retakePhoto}
              variant="ghost"
              size="lg"
              disabled={isVerifying}
              className="text-white border-white hover:bg-gray-700"
            >
              <span className="mr-2">↺</span>
              Retake
            </Button>
            <Button
              onClick={confirmCapture}
              variant="primary"
              size="lg"
              loading={isVerifying}
              className="bg-green-600 hover:bg-green-700"
            >
              <span className="mr-2">✓</span>
              {isVerifying ? 'Verifying...' : 'Use Photo'}
            </Button>
          </div>
        ) : (
          // Capture controls
          <div className="flex items-center justify-center gap-8">
            {/* Switch camera button */}
            <button
              onClick={toggleCamera}
              disabled={!isCameraReady}
              className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* Capture button */}
            <button
              onClick={capturePhoto}
              disabled={!isCameraReady}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-16 h-16 rounded-full border-4 border-gray-900"></div>
            </button>
            
            {/* Placeholder for symmetry */}
            <div className="w-12 h-12"></div>
          </div>
        )}
        
        {/* Instructions */}
        {!capturedImage && isCameraReady && !error && (
          <p className="text-gray-400 text-center mt-4 text-sm">
            📸 Take a clear photo of the incident for AI verification
          </p>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
