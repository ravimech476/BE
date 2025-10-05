const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const blogRoutes = require('./src/routes/blogRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const leaderRoutes = require('./src/routes/leaderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const isDevelopment = process.env.NODE_ENV === 'development';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Only apply rate limiting in production
if (!isDevelopment) {
    // Rate limiting for production
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        handler: (req, res) => {
            res.status(429).json({
                error: 'Too many requests from this IP, please try again later.'
            });
        },
        standardHeaders: true,
        legacyHeaders: false,
    });

    app.use('/api/', limiter);

    // Stricter rate limit for auth endpoints
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        handler: (req, res) => {
            res.status(429).json({
                error: 'Too many authentication attempts, please try again later.'
            });
        },
        standardHeaders: true,
        legacyHeaders: false,
    });

    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
} else {
    console.log('🔧 Rate limiting disabled in development mode');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (isDevelopment) {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/leaders', leaderRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        rateLimiting: !isDevelopment
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Blog API Server',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        endpoints: {
            auth: '/api/auth',
            blog: '/api/blog',
            events: '/api/events',
            leaders: '/api/leaders',
            health: '/api/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    
    // Always return JSON
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    
    res.status(status).json({ 
        error: message,
        ...(isDevelopment && { 
            stack: err.stack,
            details: err 
        })
    });
});

// Start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();
        
        // Start listening
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 API URL: http://localhost:${PORT}`);
            console.log(`🎨 Frontend URL: ${process.env.CLIENT_URL}`);
            if (isDevelopment) {
                console.log('🔧 Development mode: Rate limiting disabled');
            }
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    app.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;
