import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import inventoryRoutes from './routes/inventory';
import salesRoutes from './routes/sales';
import forecastRoutes from './routes/forecast';
import customerRoutes from './routes/customers';
import alertRoutes from './routes/alerts';
import importRoutes from './routes/import';
import etlRoutes from './routes/etl';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/import', importRoutes);
app.use('/api/etl', etlRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
