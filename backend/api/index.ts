/**
 * Vercel serverless entry point.
 *
 * vercel.json rewrites every path to this function, and the rewrite keeps the
 * original URL, so the Express router below still matches /api/leads, /health
 * and the rest exactly as it does when running locally.
 */
import app from '../src/app';

export default app;
