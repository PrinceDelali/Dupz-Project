import express from 'express';
import { getGeminiRecommendations } from '../controllers/recommendationController.js';

const router = express.Router();

// @route   POST /api/recommendations/gemini
// @desc    Get AI-powered product recommendations using Google's Gemini
// @access  Public
router.post('/gemini', getGeminiRecommendations);

export default router; 