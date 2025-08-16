import { useState, useEffect, useCallback, useRef } from 'react';
import { detectFace, getFaceDescriptor, initializeFaceAPI } from '@/lib/face-api';
import * as faceapi from 'face-api.js';

export interface FaceDetectionHook {
  isDetecting: boolean;
  faceDetected: boolean;
  faceDescriptor: number[] | null;
  confidence: number;
  isBlinking: boolean;
  error: string | null;
  startDetection: (video: HTMLVideoElement) => void;
  stopDetection: () => void;
}

export function useFaceDetection(): FaceDetectionHook {
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastEyeStateRef = useRef<boolean>(true); // true = eyes open

  const detectBlink = useCallback((landmarks: faceapi.FaceLandmarks68): boolean => {
    // Calculate eye aspect ratio for blink detection
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    const leftEAR = calculateEyeAspectRatio(leftEye);
    const rightEAR = calculateEyeAspectRatio(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2;
    
    const blinkThreshold = 0.25;
    const currentlyBlinking = avgEAR < blinkThreshold;
    
    // Detect blink transition (was open, now closed)
    if (lastEyeStateRef.current && currentlyBlinking) {
      lastEyeStateRef.current = false;
      return true;
    } else if (!lastEyeStateRef.current && !currentlyBlinking) {
      lastEyeStateRef.current = true;
    }
    
    return false;
  }, []);

  const calculateEyeAspectRatio = (eyePoints: faceapi.Point[]): number => {
    // Vertical distances
    const A = distance(eyePoints[1], eyePoints[5]);
    const B = distance(eyePoints[2], eyePoints[4]);
    // Horizontal distance
    const C = distance(eyePoints[0], eyePoints[3]);
    
    return (A + B) / (2.0 * C);
  };

  const distance = (point1: faceapi.Point, point2: faceapi.Point): number => {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  };

  const runDetection = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      const detection = await detectFace(videoRef.current);
      
      if (detection) {
        setFaceDetected(true);
        setConfidence(detection.detection.score);
        setFaceDescriptor(getFaceDescriptor(detection));
        
        // Check for blink
        const blinked = detectBlink(detection.landmarks);
        if (blinked) {
          setIsBlinking(true);
          setTimeout(() => setIsBlinking(false), 500);
        }
      } else {
        setFaceDetected(false);
        setConfidence(0);
        setFaceDescriptor(null);
      }
    } catch (err) {
      console.error('Face detection error:', err);
      setError('Face detection failed');
    }
  }, [detectBlink]);

  const startDetection = useCallback(async (video: HTMLVideoElement) => {
    try {
      setError(null);
      await initializeFaceAPI();
      
      videoRef.current = video;
      setIsDetecting(true);
      
      // Run detection every 200ms
      detectionIntervalRef.current = setInterval(runDetection, 200);
    } catch (err) {
      setError('Failed to initialize face detection');
      console.error('Face detection initialization failed:', err);
    }
  }, [runDetection]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setFaceDetected(false);
    setFaceDescriptor(null);
    setConfidence(0);
    videoRef.current = null;
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    isDetecting,
    faceDetected,
    faceDescriptor,
    confidence,
    isBlinking,
    error,
    startDetection,
    stopDetection,
  };
}
