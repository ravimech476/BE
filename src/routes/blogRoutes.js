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

// Public routes - Blog Posts
router.get('/posts', validatePagination, optionalAuth, blogController.getAllPosts);
router.get('/posts/popular', blogController.getPopularPosts);
router.get('/posts/recent', blogController.getRecentPosts);
router.get('/posts/:id', validateId, blogController.getPost);
router.get('/posts/slug/:slug', blogController.getPostBySlug);

// Protected routes - Blog Posts
router.post('/posts', authenticate, validateBlogPost, blogController.createPost);
router.put('/posts/:id', authenticate, validateId, validateBlogPostUpdate, blogController.updatePost);
router.delete('/posts/:id', authenticate, validateId, blogController.deletePost);

// Public routes - Categories
router.get('/categories', blogController.getAllCategories);

// Admin routes - Categories
router.post('/categories', authenticate, authorize('admin'), validateCategory, blogController.createCategory);
router.put('/categories/:id', authenticate, authorize('admin'), validateId, validateCategory, blogController.updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), validateId, blogController.deleteCategory);

// Comments routes
router.get('/posts/:post_id/comments', blogController.getPostComments);
router.post('/posts/:post_id/comments', authenticate, validateComment, blogController.createComment);
router.put('/comments/:id', authenticate, validateId, validateComment, blogController.updateComment);
router.delete('/comments/:id', authenticate, validateId, blogController.deleteComment);

module.exports = router;
