const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./src/config/database');
const { setupSocketIO } = require('./src/config/socket');
const authRoutes = require('./src/routes/authRoutes');
const blogRoutes = require('./src/routes/blogRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const leaderRoutes = require('./src/routes/leaderRoutes');
const userRoutes = require('./src/routes/userRoutes');
const newsRoutes = require('./src/routes/newsRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const heroRoutes = require('./src/routes/heroRoutes');
const businessNewsRoutes = require('./src/routes/businessNewsRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const subCategoryRoutes = require('./src/routes/subCategoryRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;
const isDevelopment = process.env.NODE_ENV === 'development';

// Security middleware - Configure helmet to allow CORS for static files
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

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

// NO GLOBAL BODY PARSING - Let routes handle their own parsing
// This prevents conflicts with multer file uploads

// Compression
app.use(compression());

// Logging
if (isDevelopment) {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Serve static files for uploads with CORS headers
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
    next();
}, express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/leaders', leaderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/business-news', businessNewsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subCategoryRoutes);

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
            users: '/api/users',
            news: '/api/news',
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
        
        // Setup Socket.IO
        setupSocketIO(io);
        
        // Start listening
        server.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 API URL: http://localhost:${PORT}`);
            console.log(`🎨 Frontend URL: ${process.env.CLIENT_URL}`);
            console.log(`🔌 Socket.IO enabled for real-time chat`);
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
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = { app, io };
