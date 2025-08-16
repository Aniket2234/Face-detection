import * as faceapi from 'face-api.js';

let isInitialized = false;

export async function initializeFaceAPI(): Promise<void> {
  if (isInitialized) return;

  try {
    // Load models from CDN
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);

    isInitialized = true;
    console.log('Face-API.js models loaded successfully');
  } catch (error) {
    console.error('Failed to initialize Face-API.js:', error);
    throw error;
  }
}

export async function detectFace(video: HTMLVideoElement): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>, faceapi.FaceLandmarks68>> | null> {
  try {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection || null;
  } catch (error) {
    console.error('Face detection failed:', error);
    return null;
  }
}

export function getFaceDescriptor(detection: faceapi.WithFaceDescriptor<any>): number[] {
  return Array.from(detection.descriptor);
}

export async function detectFaceFromImageData(imageData: ImageData): Promise<number[] | null> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);

    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      return Array.from(detection.descriptor);
    }
    return null;
  } catch (error) {
    console.error('Face detection from image data failed:', error);
    return null;
  }
}

export function calculateFaceDistance(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) return 1;
  
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
  }
  return Math.sqrt(sum);
}

export function isValidFaceDescriptor(descriptor: any): descriptor is number[] {
  return Array.isArray(descriptor) && 
         descriptor.length === 128 && 
         descriptor.every(val => typeof val === 'number');
}
