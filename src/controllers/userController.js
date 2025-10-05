const User = require('../models/User');

// Get all users (for dropdowns, etc.) - Admin only
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        
        // Return simplified user data for dropdown
        const userList = users.map(user => ({
            id: user.id,
            username: user.username,
            email_id: user.email_id,
            first_name: user.first_name,
            last_name: user.last_name,
            full_name: `${user.first_name} ${user.last_name}`,
            display_name: `${user.first_name} ${user.last_name} (${user.email_id})`
        }));
        
        res.json(userList);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Get users with upcoming birthdays
exports.getUpcomingBirthdays = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const users = await User.getUpcomingBirthdays(days);
        
        // Format the data with birthday information
        const birthdayList = users.map(user => {
            const today = new Date();
            const birthDate = new Date(user.date_of_birth);
            const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
            
            // Check if birthday is today
            const isToday = today.getDate() === birthDate.getDate() && 
                           today.getMonth() === birthDate.getMonth();
            
            // Format birthday message
            let birthdayMessage;
            if (isToday) {
                birthdayMessage = 'Birthday today';
            } else {
                const options = { month: 'long', day: 'numeric', year: 'numeric' };
                birthdayMessage = `Birthday on ${thisYearBirthday.toLocaleDateString('en-US', options)}`;
            }
            
            return {
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
                email_id: user.email_id,
                date_of_birth: user.date_of_birth,
                birthday_message: birthdayMessage,
                is_today: isToday
            };
        });
        
        res.json({
            success: true,
            birthdays: birthdayList
        });
    } catch (error) {
        console.error('Error fetching upcoming birthdays:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming birthdays' });
    }
};
