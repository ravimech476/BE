const Event = require('../models/Event');

const eventController = {
    // Get all events
    getAllEvents: async (req, res) => {
        try {
            const events = await Event.getAll();
            res.json({
                success: true,
                data: events
            });
        } catch (error) {
            console.error('Get events error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch events'
            });
        }
    },

    // Get single event
    getEvent: async (req, res) => {
        try {
            const { id } = req.params;
            const event = await Event.getById(parseInt(id));
            
            if (!event) {
                return res.status(404).json({
                    success: false,
                    error: 'Event not found'
                });
            }

            res.json({
                success: true,
                data: event
            });
        } catch (error) {
            console.error('Get event error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch event'
            });
        }
    },

    // Create new event
    createEvent: async (req, res) => {
        try {
            const { event_name, event_date, description } = req.body;
            const created_by = req.user.id;

            const eventData = {
                event_name,
                event_date,
                description,
                created_by
            };

            const newEvent = await Event.create(eventData);
            
            res.status(201).json({
                success: true,
                message: 'Event created successfully',
                data: newEvent
            });
        } catch (error) {
            console.error('Create event error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create event'
            });
        }
    },

    // Update event
    updateEvent: async (req, res) => {
        try {
            const { id } = req.params;
            const { event_name, event_date, description } = req.body;

            const updateData = {};
            if (event_name !== undefined) updateData.event_name = event_name;
            if (event_date !== undefined) updateData.event_date = event_date;
            if (description !== undefined) updateData.description = description;

            const updatedEvent = await Event.update(parseInt(id), updateData);
            
            if (!updatedEvent) {
                return res.status(404).json({
                    success: false,
                    error: 'Event not found'
                });
            }

            res.json({
                success: true,
                message: 'Event updated successfully',
                data: updatedEvent
            });
        } catch (error) {
            console.error('Update event error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update event'
            });
        }
    },

    // Delete event
    deleteEvent: async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await Event.delete(parseInt(id));
            
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: 'Event not found'
                });
            }

            res.json({
                success: true,
                message: 'Event deleted successfully'
            });
        } catch (error) {
            console.error('Delete event error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete event'
            });
        }
    },

    // Get upcoming events (for home page)
    getUpcomingEvents: async (req, res) => {
        try {
            const limit = req.query.limit || 5;
            const events = await Event.getUpcoming(parseInt(limit));
            
            res.json({
                success: true,
                data: events
            });
        } catch (error) {
            console.error('Get upcoming events error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch upcoming events'
            });
        }
    }
};

module.exports = eventController;
