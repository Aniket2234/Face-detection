import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FaceDetectorProps {
  isDetecting: boolean;
  faceDetected: boolean;
  confidence: number;
  isBlinking: boolean;
  className?: string;
}

export function FaceDetector({ 
  isDetecting, 
  faceDetected, 
  confidence, 
  isBlinking,
  className 
}: FaceDetectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isDetecting && faceDetected) {
      // Draw face detection overlay
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 150;

      // Outer detection circle
      ctx.strokeStyle = faceDetected ? '#10B981' : '#6366F1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // Inner dashed circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 20, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center dot
      ctx.fillStyle = '#6366F1';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Confidence indicator
      if (confidence > 0) {
        ctx.fillStyle = '#10B981';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(confidence * 100)}%`, centerX, centerY + radius + 30);
      }

      // Blink indicator
      if (isBlinking) {
        ctx.fillStyle = '#F59E0B';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('👁 Blink detected', centerX, centerY - radius - 20);
      }
    }
  }, [isDetecting, faceDetected, confidence, isBlinking]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className={cn('absolute inset-0 pointer-events-none', className)}
    />
  );
}
