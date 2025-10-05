const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Debug logging
        console.log('Validation failed. req.body:', req.body);
        console.log('Validation errors:', errors.array());
        
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array() 
        });
    }
    next();
};

// User validation rules
const validateUserRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9._-]+$/)
        .withMessage('Username can only contain letters, numbers, dots, underscores, and hyphens'),
    body('email_id')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('first_name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name is required'),
    body('last_name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name is required'),
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9+\-() ]+$/)
        .withMessage('Invalid phone number format'),
    handleValidationErrors
];

const validateUserLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

const validatePasswordChange = [
    body('oldPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    handleValidationErrors
];

// Blog post validation rules
const validateBlogPost = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Title is required and must be less than 500 characters'),
    body('content')
        .trim()
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters'),
    body('excerpt')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Excerpt must be less than 500 characters'),
    body('status')
        .optional()
        .isIn(['draft', 'published'])
        .withMessage('Status must be either draft or published'),
    body('categories')
        .optional()
        .customSanitizer(value => {
            // Handle both JSON string and array
            if (typeof value === 'string') {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            }
            return value;
        })
        .isArray()
        .withMessage('Categories must be an array'),
    // Skip URL validation for featured_image - file uploads handle this
    handleValidationErrors
];

const validateBlogPostUpdate = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Title must be less than 500 characters'),
    body('content')
        .optional()
        .trim()
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters'),
    body('excerpt')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Excerpt must be less than 500 characters'),
    body('status')
        .optional()
        .isIn(['draft', 'published'])
        .withMessage('Status must be either draft or published'),
    body('categories')
        .optional()
        .customSanitizer(value => {
            // Handle both JSON string and array
            if (typeof value === 'string') {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            }
            return value;
        })
        .isArray()
        .withMessage('Categories must be an array'),
    // Skip URL validation for featured_image - file uploads handle this
    handleValidationErrors
];

// Category validation rules
const validateCategory = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Category name is required and must be less than 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    handleValidationErrors
];

// Comment validation rules
const validateComment = [
    body('content')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment content is required and must be less than 1000 characters'),
    handleValidationErrors
];

// ID validation
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Valid ID is required'),
    handleValidationErrors
];

// Pagination validation
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validatePasswordChange,
    validateBlogPost,
    validateBlogPostUpdate,
    validateCategory,
    validateComment,
    validateId,
    validatePagination,
    handleValidationErrors
};
