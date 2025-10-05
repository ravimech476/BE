const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const {
    validateBlogPost,
    validateBlogPostUpdate,
    validateCategory,
    validateComment,
    validateId,
    validatePagination
} = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// JSON body parser for non-file-upload routes
const jsonParser = express.json({ limit: '10mb' });

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/blog');
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
        cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
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

// Public routes - Blog Posts
router.get('/posts', jsonParser, optionalAuth, blogController.getAllPosts);
router.get('/posts/popular', jsonParser, blogController.getPopularPosts);
router.get('/posts/recent', jsonParser, blogController.getRecentPosts);
router.get('/posts/:id', jsonParser, blogController.getPost);
router.get('/posts/slug/:slug', jsonParser, blogController.getPostBySlug);

// Protected routes - Blog Posts (with file uploads - NO json parser)
// Validation handled on frontend
router.post('/posts', authenticate, upload.single('image'), blogController.createPost);
router.put('/posts/:id', authenticate, upload.single('image'), blogController.updatePost);
router.delete('/posts/:id', authenticate, jsonParser, blogController.deletePost);

// Public routes - Categories
router.get('/categories', jsonParser, blogController.getAllCategories);

// Admin routes - Categories
router.post('/categories', authenticate, authorize('admin'), jsonParser, blogController.createCategory);
router.put('/categories/:id', authenticate, authorize('admin'), jsonParser, blogController.updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), jsonParser, blogController.deleteCategory);

// Comments routes
router.get('/posts/:post_id/comments', jsonParser, blogController.getPostComments);
router.post('/posts/:post_id/comments', authenticate, jsonParser, blogController.createComment);
router.put('/comments/:id', authenticate, jsonParser, blogController.updateComment);
router.delete('/comments/:id', authenticate, jsonParser, blogController.deleteComment);

module.exports = router;
