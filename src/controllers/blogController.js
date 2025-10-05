const BlogPost = require('../models/BlogPost');
const Category = require('../models/Category');
const Comment = require('../models/Comment');

// Blog Post Controllers
const createPost = async (req, res) => {
    try {
        console.log('Creating post with data:', req.body);
        console.log('User:', req.user);
        
        const postData = {
            ...req.body,
            author_id: req.user.id
        };
        
        const post = await BlogPost.create(postData);
        console.log('Post created successfully:', post.id);
        
        res.status(201).json({
            success: true,
            message: 'Blog post created successfully',
            post
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ 
            error: 'Failed to create blog post',
            details: error.message 
        });
    }
};

const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Updating post:', id, req.body);
        
        // Check if post exists and user is the author or admin
        const existingPost = await BlogPost.findById(id);
        if (!existingPost) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        if (existingPost.author_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this post' });
        }
        
        const post = await BlogPost.update(id, req.body);
        console.log('Post updated successfully:', id);
        
        res.json({
            success: true,
            message: 'Blog post updated successfully',
            post
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ 
            error: 'Failed to update blog post',
            details: error.message 
        });
    }
};

const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if post exists and user is the author or admin
        const existingPost = await BlogPost.findById(id);
        if (!existingPost) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        if (existingPost.author_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this post' });
        }
        
        await BlogPost.delete(id);
        
        res.json({
            success: true,
            message: 'Blog post deleted successfully'
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ 
            error: 'Failed to delete blog post',
            details: error.message 
        });
    }
};

const getPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await BlogPost.findById(id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Get comments for this post
        const comments = await Comment.getByPostId(id);
        
        res.json({
            success: true,
            post: {
                ...post,
                comments
            }
        });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ 
            error: 'Failed to get blog post',
            details: error.message 
        });
    }
};

const getPostBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await BlogPost.findBySlug(slug);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Get comments for this post
        const comments = await Comment.getByPostId(post.id);
        
        res.json({
            success: true,
            post: {
                ...post,
                comments
            }
        });
    } catch (error) {
        console.error('Get post by slug error:', error);
        res.status(500).json({ 
            error: 'Failed to get blog post',
            details: error.message 
        });
    }
};

const getAllPosts = async (req, res) => {
    try {
        console.log('Getting all posts with filters:', req.query);
        
        const filters = {
            ...req.query,
            // Remove default status filter to show all posts to logged in users
            status: req.query.status || (req.user ? undefined : 'published')
        };
        
        // If user is requesting their own posts
        if (req.query.my_posts === 'true' && req.user) {
            filters.author_id = req.user.id;
            delete filters.status; // Show all statuses for own posts
        }
        
        // For public view (not logged in), only show published posts
        if (!req.user && !filters.status) {
            filters.status = 'published';
        }
        
        console.log('Final filters:', filters);
        const result = await BlogPost.getAll(filters);
        console.log(`Found ${result.posts.length} posts`);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ 
            error: 'Failed to get blog posts',
            details: error.message 
        });
    }
};

const getPopularPosts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const posts = await BlogPost.getPopular(limit);
        
        res.json({
            success: true,
            posts
        });
    } catch (error) {
        console.error('Get popular posts error:', error);
        res.status(500).json({ 
            error: 'Failed to get popular posts',
            details: error.message 
        });
    }
};

const getRecentPosts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const posts = await BlogPost.getRecent(limit);
        
        res.json({
            success: true,
            posts
        });
    } catch (error) {
        console.error('Get recent posts error:', error);
        res.status(500).json({ 
            error: 'Failed to get recent posts',
            details: error.message 
        });
    }
};

// Category Controllers
const createCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ 
            error: 'Failed to create category',
            details: error.message 
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.update(id, req.body);
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({
            success: true,
            message: 'Category updated successfully',
            category
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ 
            error: 'Failed to update category',
            details: error.message 
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Category.delete(id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        if (error.message.includes('associated posts')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ 
            error: 'Failed to delete category',
            details: error.message 
        });
    }
};

const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.getAll();
        
        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ 
            error: 'Failed to get categories',
            details: error.message 
        });
    }
};

// Comment Controllers
const createComment = async (req, res) => {
    try {
        const { post_id } = req.params;
        
        // Check if post exists
        const post = await BlogPost.findById(post_id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const comment = await Comment.create({
            post_id: parseInt(post_id),
            user_id: req.user.id,
            content: req.body.content,
            status: 'approved'
        });
        
        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            comment
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ 
            error: 'Failed to create comment',
            details: error.message 
        });
    }
};

const updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if comment exists and user is the author
        const existingComment = await Comment.findById(id);
        if (!existingComment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        if (existingComment.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this comment' });
        }
        
        const comment = await Comment.update(id, { content: req.body.content });
        
        res.json({
            success: true,
            message: 'Comment updated successfully',
            comment
        });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ 
            error: 'Failed to update comment',
            details: error.message 
        });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if comment exists and user is the author or admin
        const existingComment = await Comment.findById(id);
        if (!existingComment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        if (existingComment.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }
        
        await Comment.delete(id);
        
        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ 
            error: 'Failed to delete comment',
            details: error.message 
        });
    }
};

const getPostComments = async (req, res) => {
    try {
        const { post_id } = req.params;
        const comments = await Comment.getByPostId(post_id);
        
        res.json({
            success: true,
            comments
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ 
            error: 'Failed to get comments',
            details: error.message 
        });
    }
};

module.exports = {
    createPost,
    updatePost,
    deletePost,
    getPost,
    getPostBySlug,
    getAllPosts,
    getPopularPosts,
    getRecentPosts,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
    createComment,
    updateComment,
    deleteComment,
    getPostComments
};
