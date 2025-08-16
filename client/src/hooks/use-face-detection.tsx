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
  const sessionId = useRef<string>(Date.now().toString(36) + Math.random().toString(36).substr(2));
  const lastDetectionTime = useRef<number>(0);
  const stableFaceCount = useRef<number>(0);

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
      // Throttle detection to avoid overwhelming the system (slower for server processing)
      const now = Date.now();
      if (now - lastDetectionTime.current < 500) return; // Increased to 500ms between detections
      lastDetectionTime.current = now;
      
      const detection = await detectFace(videoRef.current);
      
      if (detection) {
        // Require multiple stable detections for better accuracy
        stableFaceCount.current += 1;
        
        if (stableFaceCount.current >= 5) { // Need 5 stable detections for better accuracy
          setFaceDetected(true);
          setConfidence(detection.detection.score);
          setFaceDescriptor(getFaceDescriptor(detection));
          
          // Check for blink
          const blinked = detectBlink(detection.landmarks);
          if (blinked) {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 500);
          }
        }
        setError(null);
      } else {
        stableFaceCount.current = 0;
        setFaceDetected(false);
        setFaceDescriptor(null);
        setConfidence(0);
      }
    } catch (err) {
      console.error('Face detection error:', err);
      setError('Face detection failed');
    }
  }, [detectBlink]);

  const startDetection = useCallback((video: HTMLVideoElement) => {
    if (isDetecting) return;
    
    videoRef.current = video;
    setIsDetecting(true);
    setError(null);
    
    // Start detection loop with slower timing for server processing
    detectionIntervalRef.current = setInterval(runDetection, 400); // Much slower for server stability
  }, [isDetecting, runDetection]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setFaceDetected(false);
    setFaceDescriptor(null);
    setConfidence(0);
    stableFaceCount.current = 0;
    videoRef.current = null;
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  // Initialize Face API
  useEffect(() => {
    const init = async () => {
      try {
        await initializeFaceAPI();
      } catch (err) {
        console.error('Face API initialization error:', err);
        setError('Failed to initialize face detection');
      }
    };
    
    init();
  }, []);

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