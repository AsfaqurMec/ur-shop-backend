import path from 'path';
import express from 'express';
import cors from 'cors';
import { env, getUploadAbsoluteBase } from './src/config';
import { errorHandler } from './src/middlewares';
import routes from './src/routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Public uploads: product images only (payment proofs & ticket attachments stay private)
const uploadBase = getUploadAbsoluteBase();
app.use('/products/images', express.static(path.join(uploadBase, 'products', 'images')));
app.use('/settings/logos', express.static(path.join(uploadBase, 'settings', 'logos')));
app.use('/reviews/images', express.static(path.join(uploadBase, 'reviews', 'images')));

app.use(env.apiPrefix, routes);

app.use(errorHandler);

app.get('/', (req, res) => {
    res.send('Backend is running 🚀');
  });

export default app;
