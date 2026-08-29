import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * AI Image Verification Service
 * Analyzes images to determine if they are real or AI-generated
 * Returns a confidence score (0-100) indicating authenticity
 */

// Configuration for AI verification
const AI_CONFIG = {
  // Threshold for automatic routing to responding team
  REAL_IMAGE_THRESHOLD: 80,
  // API endpoints (configure based on your AI service provider)
  SIGHTENGINE_API_USER: process.env.SIGHTENGINE_API_USER,
  SIGHTENGINE_API_SECRET: process.env.SIGHTENGINE_API_SECRET,
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
};

/**
 * Main verification function - analyzes image for authenticity
 * @param {Buffer|string} imageData - Base64 encoded image or image buffer
 * @param {string} mimeType - MIME type of the image
 * @returns {Object} - Verification result with score and decision
 */
export const verifyImageAuthenticity = async (imageData, mimeType = 'image/jpeg') => {
  try {
    // 1. Try Sightengine primary service if configured
    if (AI_CONFIG.SIGHTENGINE_API_USER && AI_CONFIG.SIGHTENGINE_API_SECRET) {
      const primaryResult = await verifyWithPrimaryService(imageData, mimeType);
      if (primaryResult.success) {
        return {
          ...primaryResult,
          isRealImage: primaryResult.score >= AI_CONFIG.REAL_IMAGE_THRESHOLD,
          verifiedAt: new Date(),
        };
      }
    }

    // 2. Try Hugging Face fallback service if configured
    if (AI_CONFIG.HUGGINGFACE_API_KEY) {
      const fallbackResult = await verifyWithFallbackService(imageData, mimeType);
      if (fallbackResult.success) {
        return {
          ...fallbackResult,
          isRealImage: fallbackResult.score >= AI_CONFIG.REAL_IMAGE_THRESHOLD,
          verifiedAt: new Date(),
        };
      }
    }

    // 3. Realistic simulated AI verification for local/demo environments
    const mockResult = await mockVerification(imageData);
    return {
      ...mockResult,
      isRealImage: mockResult.score >= AI_CONFIG.REAL_IMAGE_THRESHOLD,
      verifiedAt: new Date(),
    };
  } catch (error) {
    console.error('AI Verification Error:', error.message);
    return {
      success: false,
      score: 50,
      isRealImage: false,
      confidence: 'low',
      error: error.message,
      verifiedAt: new Date(),
    };
  }
};

/**
 * Primary verification using Sightengine API (if configured)
 * Sightengine provides AI-generated image detection
 */
const verifyWithPrimaryService = async (imageData, mimeType) => {
  if (!AI_CONFIG.SIGHTENGINE_API_USER || !AI_CONFIG.SIGHTENGINE_API_SECRET) {
    return { success: false, error: 'Sightengine API not configured' };
  }

  try {
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    
    // Convert base64 to buffer if needed
    const imageBuffer = typeof imageData === 'string' 
      ? Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      : imageData;
    
    formData.append('media', imageBuffer, {
      filename: 'image.jpg',
      contentType: mimeType,
    });
    formData.append('api_user', AI_CONFIG.SIGHTENGINE_API_USER);
    formData.append('api_secret', AI_CONFIG.SIGHTENGINE_API_SECRET);
    formData.append('models', 'genai');

    const response = await axios.post(
      'https://api.sightengine.com/1.0/check.json',
      formData,
      { headers: formData.getHeaders() }
    );

    if (response.data && response.data.status === 'success') {
      // Sightengine returns ai_generated probability (0-1)
      const aiGenProb = response.data.type?.ai_generated || 0;
      const realScore = Math.round((1 - aiGenProb) * 100);
      
      return {
        success: true,
        score: realScore,
        confidence: 'high',
        provider: 'sightengine',
        details: {
          aiGeneratedProbability: aiGenProb,
          rawResponse: response.data,
        },
      };
    }
    
    return { success: false, error: 'Invalid response from Sightengine' };
  } catch (error) {
    console.error('Sightengine API Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Fallback verification using Hugging Face API
 * Uses image classification models for AI detection
 */
const verifyWithFallbackService = async (imageData, mimeType) => {
  if (!AI_CONFIG.HUGGINGFACE_API_KEY) {
    return { success: false, error: 'Hugging Face API not configured' };
  }

  try {
    const imageBuffer = typeof imageData === 'string'
      ? Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      : imageData;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/umm-maybe/AI-image-detector',
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.HUGGINGFACE_API_KEY}`,
          'Content-Type': mimeType,
        },
      }
    );

    if (response.data && Array.isArray(response.data)) {
      // Find the "real" or "human" label score
      const realLabel = response.data.find(r => 
        r.label?.toLowerCase().includes('real') || 
        r.label?.toLowerCase().includes('human')
      );
      const aiLabel = response.data.find(r => 
        r.label?.toLowerCase().includes('ai') || 
        r.label?.toLowerCase().includes('artificial')
      );

      let realScore = 50;
      if (realLabel) {
        realScore = Math.round(realLabel.score * 100);
      } else if (aiLabel) {
        realScore = Math.round((1 - aiLabel.score) * 100);
      }

      return {
        success: true,
        score: realScore,
        confidence: 'medium',
        provider: 'huggingface',
        details: {
          labels: response.data,
        },
      };
    }

    return { success: false, error: 'Invalid response from Hugging Face' };
  } catch (error) {
    console.error('Hugging Face API Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Mock verification for development/demo purposes
 * Simulates AI verification with randomized realistic results
 * In production, replace with actual AI service
 */
const mockVerification = async (imageData) => {
  // Simulate API processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate a realistic score distribution
  // Real camera photos typically score 75-98%
  // This simulation favors real images with occasional lower scores
  const random = Math.random();
  let score;
  
  if (random < 0.7) {
    // 70% chance of high score (real image)
    score = Math.floor(Math.random() * 18) + 82; // 82-99
  } else if (random < 0.9) {
    // 20% chance of medium score (uncertain)
    score = Math.floor(Math.random() * 15) + 65; // 65-79
  } else {
    // 10% chance of low score (suspicious)
    score = Math.floor(Math.random() * 30) + 35; // 35-64
  }

  return {
    success: true,
    score,
    confidence: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
    provider: 'mock',
    details: {
      note: 'Mock verification - configure AI API for production',
      analysisTime: '1.5s',
    },
  };
};

/**
 * Determine routing destination based on AI verification score
 * @param {number} score - AI verification score (0-100)
 * @param {string} uploadMethod - Method used to upload media
 * @returns {string} - Always 'verification_team'
 */
export const determineRoutingDestination = (score, uploadMethod) => {
  // All AI-verified images go to the verification team for manual review.
  return 'verification_team';
};

/**
 * Get the threshold value for real image detection
 */
export const getRealImageThreshold = () => AI_CONFIG.REAL_IMAGE_THRESHOLD;

export default {
  verifyImageAuthenticity,
  determineRoutingDestination,
  getRealImageThreshold,
};
