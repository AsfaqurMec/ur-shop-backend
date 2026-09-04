import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env, getUploadAbsoluteBase } from './src/config';
import { errorHandler } from './src/middlewares';
import { sanitizeNoSql, apiLimiter } from './src/middlewares/security';
import routes from './src/routes';

const app = express();

// Enable Gzip/Brotli compression for all JSON/text responses
app.use(compression());

// Trust reverse proxy (Render / Nginx / Cloudflare / Next.js)
app.set('trust proxy', 1);

// Enterprise HTTP security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // CSP handled by Next.js edge / reverse proxy
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration with credentials enabled
const allowedOrigins = [
  env.frontendUrl?.replace(/\/$/, ''),
  process.env.APP_BASE_URL?.replace(/\/$/, ''),
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
].filter((x): x is string => Boolean(x));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-side Next.js rewrites / mobile / curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (env.nodeEnv !== 'production') {
        if (origin.endsWith('.vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Parse cookies and request bodies with strict size caps
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Strip MongoDB operators ($ and .) to prevent NoSQL injection
app.use(sanitizeNoSql);

// Public uploads: product images only (payment proofs & ticket attachments stay private)
const uploadBase = getUploadAbsoluteBase();
app.use('/products/images', express.static(path.join(uploadBase, 'products', 'images')));
app.use('/settings/logos', express.static(path.join(uploadBase, 'settings', 'logos')));
app.use('/reviews/images', express.static(path.join(uploadBase, 'reviews', 'images')));

// API routes with rate limiting
app.use(env.apiPrefix, apiLimiter, routes);

app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

export default app;
