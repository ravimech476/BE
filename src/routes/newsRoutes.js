const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// JSON body parser for non-file-upload routes
const jsonParser = express.json({ limit: '10mb' });

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/news');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'news-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Public routes
router.get('/', jsonParser, newsController.getAllNews);
router.get('/:id', jsonParser, newsController.getNews);

// Admin routes (with file uploads - NO json parser for create/update)
router.get('/admin/all', authenticate, authorize('admin'), jsonParser, newsController.getAllNewsForAdmin);
router.post('/', authenticate, authorize('admin'), upload.single('image'), newsController.createNews);
router.put('/:id', authenticate, authorize('admin'), upload.single('image'), newsController.updateNews);
router.delete('/:id', authenticate, authorize('admin'), jsonParser, newsController.deleteNews);

module.exports = router;
