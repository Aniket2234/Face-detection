import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useCamera } from '@/hooks/use-camera';
import { useFaceDetection } from '@/hooks/use-face-detection';
import { FaceDetector } from '@/components/face-detector';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Settings, Camera as CameraIcon, RotateCcw, Image, CheckCircle, X } from 'lucide-react';

export default function Camera() {
  const { mode } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const { 
    videoRef, 
    isStreaming, 
    error: cameraError, 
    startCamera, 
    stopCamera, 
    captureImage 
  } = useCamera();

  const {
    isDetecting,
    faceDetected,
    faceDescriptor,
    confidence,
    isBlinking,
    error: detectionError,
    startDetection,
    stopDetection,
  } = useFaceDetection();

  const registerMutation = useMutation({
    mutationFn: async (userData: { name: string; faceDescriptor: number[]; profileImage: string }) => {
      const response = await apiRequest('POST', '/api/users', { ...userData, role: 'Employee' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Registration Successful",
        description: "Face has been registered successfully!",
      });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed", 
        description: error.message || "Failed to register face",
        variant: "destructive",
      });
    },
  });

  const recognizeMutation = useMutation({
    mutationFn: async (faceDescriptor: number[]) => {
      const response = await apiRequest('POST', '/api/recognize', { faceDescriptor });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.user) {
        toast({
          title: "Authentication Successful",
          description: `Welcome back, ${data.user.name}! Confidence: ${data.confidence}%`,
        });
        setTimeout(() => setLocation('/dashboard'), 1500);
      } else {
        toast({
          title: "Authentication Failed",
          description: "Face not recognized. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Authentication Error",
        description: "Failed to process face recognition",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      stopDetection();
    };
  }, [startCamera, stopCamera, stopDetection]);

  useEffect(() => {
    if (videoRef.current && isStreaming) {
      startDetection(videoRef.current);
    }
  }, [isStreaming, startDetection]);

  const handleCapture = async () => {
    if (!faceDetected || !faceDescriptor) {
      toast({
        title: "No Face Detected",
        description: "Please position your face in the detection area",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        toast({
          title: "Name Required",
          description: "Please enter your name to register",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      setProgress(25);

      const profileImage = captureImage();
      if (!profileImage) {
        toast({
          title: "Capture Failed",
          description: "Failed to capture profile image",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      setProgress(75);
      
      registerMutation.mutate({
        name: name.trim(),
        faceDescriptor,
        profileImage,
      });

      setProgress(100);
      setTimeout(() => setIsProcessing(false), 500);
    } else {
      // Authentication mode
      setIsProcessing(true);
      setProgress(50);
      
      recognizeMutation.mutate(faceDescriptor);
      
      setProgress(100);
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const handleBack = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col">
      
      {/* Camera Feed Background */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          data-testid="camera-video"
        />
        <FaceDetector
          isDetecting={isDetecting}
          faceDetected={faceDetected}
          confidence={confidence}
          isBlinking={isBlinking}
          className="absolute inset-0"
        />
      </div>
      
      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between p-3 sm:p-6 bg-black/30 backdrop-blur-sm safe-area-inset-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="w-9 h-9 sm:w-12 sm:h-12 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 touch-manipulation flex-shrink-0"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </Button>
        
        <h1 className="text-white font-semibold text-sm sm:text-lg text-center flex-1 px-2 truncate" data-testid="camera-title">
          {mode === 'register' ? 'Register Face' : 'Face Authentication'}
        </h1>
        
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 sm:w-12 sm:h-12 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 touch-manipulation flex-shrink-0"
          data-testid="button-settings"
        >
          <Settings className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </Button>
      </div>

      {/* Face Detection Overlay */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Detection Circle */}
        <div className="relative mb-4 sm:mb-8">
          {/* Outer scanning ring */}
          <div className={`w-48 h-48 sm:w-80 sm:h-80 rounded-full border-4 ${
            faceDetected ? 'border-success animate-pulse-border' : 'border-primary animate-pulse'
          }`} data-testid="detection-circle" />
          
          {/* Inner face area */}
          <div className="absolute inset-2 sm:inset-4 rounded-full border-2 border-dashed border-white/50" />
          
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 sm:w-4 sm:h-4 bg-primary rounded-full animate-ping" />
          
          {/* Face detection indicator */}
          <div className="absolute -top-4 sm:-top-8 left-1/2 transform -translate-x-1/2">
            <div className={`px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium animate-face-scan ${
              faceDetected ? 'bg-success text-white' : 'bg-yellow-500 text-white'
            }`} data-testid="detection-status">
              {faceDetected ? (
                <>
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Face Detected</span>
                  <span className="sm:hidden">Found</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Looking for face...</span>
                  <span className="sm:hidden">Scanning...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-2 sm:space-y-4">
          <h2 className="text-lg sm:text-2xl font-bold text-white" data-testid="instruction-title">
            Position Your Face
          </h2>
          <p className="text-white/80 max-w-xs sm:max-w-sm text-xs sm:text-base px-4" data-testid="instruction-text">
            Look directly at the camera and keep your face within the circle
          </p>
          
          {/* Liveness Detection Instructions */}
          <Card className="bg-black/40 border-white/20 backdrop-blur-sm max-w-xs sm:max-w-sm mx-auto" data-testid="liveness-card">
            <CardContent className="p-2 sm:p-4">
              <h3 className="text-white font-semibold mb-2 text-xs sm:text-base">Liveness Check</h3>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                    isBlinking ? 'bg-success' : 'bg-yellow-500'
                  }`}>
                    <CheckCircle className="w-2 h-2 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <span className="text-white/80 text-xs sm:text-sm">Blink naturally</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <span className="text-white/80 text-xs sm:text-sm">Keep face steady</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Registration Form Modal */}
      {mode === 'register' && (
        <div className="fixed bottom-16 sm:bottom-32 left-3 right-3 sm:left-6 sm:right-6 z-20">
          <Card className="bg-black/60 border-white/20 backdrop-blur-sm" data-testid="registration-form">
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white text-xs sm:text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 h-10 sm:h-12 text-sm sm:text-base rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="input-name"
                />
                <p className="text-white/60 text-xs">This name will be used for face recognition</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="relative z-10 p-3 sm:p-6 bg-black/30 backdrop-blur-sm safe-area-inset-bottom">
        <div className="flex items-center justify-center space-x-4 sm:space-x-8">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 touch-manipulation"
            data-testid="button-gallery"
          >
            <Image className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </Button>
          
          {/* Capture Button */}
          <Button
            onClick={handleCapture}
            disabled={!faceDetected || isProcessing || registerMutation.isPending || recognizeMutation.isPending}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full shadow-lg shadow-primary/50 relative overflow-hidden group hover:bg-primary/90 disabled:opacity-50 touch-manipulation"
            data-testid="button-capture"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-active:scale-100 transition-transform duration-150" />
            <CameraIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white relative z-10" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              stopCamera();
              setTimeout(startCamera, 100);
            }}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 touch-manipulation"
            data-testid="button-refresh"
          >
            <RotateCcw className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </Button>
        </div>
        
        {/* Progress Indicator */}
        {isProcessing && (
          <div className="mt-4 space-y-2" data-testid="progress-indicator">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-white/60 text-sm">
              Processing... {progress}%
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {(cameraError || detectionError) && (
        <div className="absolute top-20 left-4 right-4 z-20" data-testid="error-display">
          <Card className="bg-error/90 border-error">
            <CardContent className="p-4 flex items-center space-x-3">
              <X className="w-5 h-5 text-white" />
              <p className="text-white text-sm">
                {cameraError || detectionError}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
