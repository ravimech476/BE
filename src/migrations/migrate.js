const { connectDB } = require('../config/database');
const { createTables, dropTables } = require('./createTables');

const runMigration = async () => {
    const command = process.argv[2];
    
    try {
        await connectDB();
        
        switch(command) {
            case 'up':
                console.log('Running migrations...');
                await createTables();
                console.log('✅ Migrations completed');
                break;
            case 'down':
                console.log('Rolling back migrations...');
                await dropTables();
                console.log('✅ Rollback completed');
                break;
            default:
                console.log('Usage: npm run migrate:up or npm run migrate:down');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
};

runMigration();
