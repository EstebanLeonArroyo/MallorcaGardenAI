import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import geminiRoutes from './routes/gemini.js';
import designRoutes from './routes/designs.js';
import imageDesignRoutes from './routes/imageDesign.js';

// --- Validación de variables de entorno requeridas ---
const REQUIRED_ENV_VARS = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
    'FAL_KEY',
];

const missingEnv = REQUIRED_ENV_VARS.filter(name => !process.env[name]);
if (missingEnv.length > 0) {
    console.error('❌ Faltan variables de entorno obligatorias:');
    missingEnv.forEach(name => console.error(`   - ${name}`));
    console.error('   Copia backend/.env.example a backend/.env y rellena los valores.');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// --- Security headers ---
app.use(helmet());

// --- CORS — solo permite el frontend ---
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// --- Body parsing (50mb para múltiples imágenes base64) ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- Health check ---
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use('/api/gemini', geminiRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/image-design', imageDesignRoutes);

// --- Global error handler ---
app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    const message = err.message || 'Error desconocido';

    if (status >= 500) {
        console.error('[Error]', message, '\n', err.stack);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }

    console.error('[Error]', message);
    res.status(status).json({ error: message });
});

// --- Start server ---
app.listen(PORT, () => {
    console.log(`🌿 Mallorca Garden API corriendo en http://localhost:${PORT}`);
    console.log(`   Frontend permitido: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
