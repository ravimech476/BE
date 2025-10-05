const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// JSON body parser for all event routes
const jsonParser = express.json({ limit: '10mb' });

// Validation middleware
const validateEvent = [
    body('event_name')
        .notEmpty()
        .withMessage('Event name is required')
        .isLength({ min: 3, max: 255 })
        .withMessage('Event name must be between 3 and 255 characters'),
    body('event_date')
        .notEmpty()
        .withMessage('Event date is required')
        .isISO8601()
        .withMessage('Please provide a valid date')
        .custom((value) => {
            const eventDate = new Date(value);
            const now = new Date();
            if (eventDate < now) {
                throw new Error('Event date cannot be in the past');
            }
            return true;
        }),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    handleValidationErrors
];

const validateEventUpdate = [
    body('event_name')
        .optional()
        .isLength({ min: 3, max: 255 })
        .withMessage('Event name must be between 3 and 255 characters'),
    body('event_date')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    handleValidationErrors
];

const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid event ID'),
    handleValidationErrors
];

// Public routes - For displaying events to employees
router.get('/upcoming', jsonParser, eventController.getUpcomingEvents);
router.get('/', jsonParser, eventController.getAllEvents);
router.get('/:id', validateId, jsonParser, eventController.getEvent);

// Admin only routes - For managing events
router.post('/', authenticate, authorize('admin'), jsonParser, validateEvent, eventController.createEvent);
router.put('/:id', authenticate, authorize('admin'), validateId, jsonParser, validateEventUpdate, eventController.updateEvent);
router.delete('/:id', authenticate, authorize('admin'), validateId, jsonParser, eventController.deleteEvent);

module.exports = router;
