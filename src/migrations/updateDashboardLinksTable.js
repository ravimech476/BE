const { getPool, sql, connectDB } = require('../config/database');

const updateDashboardLinksTable = async () => {
    try {
        await connectDB();
        const pool = getPool();
        
        console.log('Updating dashboard_links table...');
        
        // Check if columns already exist
        const checkColumns = await pool.request().query(`
            SELECT 
                CASE WHEN EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE object_id = OBJECT_ID('dashboard_links') 
                    AND name = 'category_id'
                ) THEN 1 ELSE 0 END as category_exists,
                CASE WHEN EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE object_id = OBJECT_ID('dashboard_links') 
                    AND name = 'subcategory_id'
                ) THEN 1 ELSE 0 END as subcategory_exists
        `);
        
        const { category_exists, subcategory_exists } = checkColumns.recordset[0];
        
        // Add category_id column if it doesn't exist
        if (!category_exists) {
            await pool.request().query(`
                ALTER TABLE dashboard_links
                ADD category_id INT NULL
            `);
            console.log('✅ Added category_id column');
        } else {
            console.log('ℹ️  category_id column already exists');
        }
        
        // Add subcategory_id column if it doesn't exist
        if (!subcategory_exists) {
            await pool.request().query(`
                ALTER TABLE dashboard_links
                ADD subcategory_id INT NULL
            `);
            console.log('✅ Added subcategory_id column');
        } else {
            console.log('ℹ️  subcategory_id column already exists');
        }
        
        // Add foreign key constraints if columns were just added
        if (!category_exists || !subcategory_exists) {
            // Check if foreign keys already exist before creating
            const checkFK = await pool.request().query(`
                SELECT 
                    CASE WHEN EXISTS (
                        SELECT * FROM sys.foreign_keys 
                        WHERE name = 'FK_dashboard_links_category'
                    ) THEN 1 ELSE 0 END as fk_category_exists,
                    CASE WHEN EXISTS (
                        SELECT * FROM sys.foreign_keys 
                        WHERE name = 'FK_dashboard_links_subcategory'
                    ) THEN 1 ELSE 0 END as fk_subcategory_exists
            `);
            
            const { fk_category_exists, fk_subcategory_exists } = checkFK.recordset[0];
            
            if (!fk_category_exists && !category_exists) {
                await pool.request().query(`
                    ALTER TABLE dashboard_links
                    ADD CONSTRAINT FK_dashboard_links_category 
                    FOREIGN KEY (category_id) REFERENCES categories(id)
                `);
                console.log('✅ Added foreign key constraint for category_id');
            }
            
            if (!fk_subcategory_exists && !subcategory_exists) {
                await pool.request().query(`
                    ALTER TABLE dashboard_links
                    ADD CONSTRAINT FK_dashboard_links_subcategory 
                    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
                `);
                console.log('✅ Added foreign key constraint for subcategory_id');
            }
        }
        
        // Create indexes for better performance
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_dashboard_links_category_id' AND object_id = OBJECT_ID('dashboard_links'))
            BEGIN
                CREATE INDEX idx_dashboard_links_category_id ON dashboard_links(category_id);
            END
            
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_dashboard_links_subcategory_id' AND object_id = OBJECT_ID('dashboard_links'))
            BEGIN
                CREATE INDEX idx_dashboard_links_subcategory_id ON dashboard_links(subcategory_id);
            END
        `);
        
        console.log('✅ Indexes created on dashboard_links table');
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating dashboard_links table:', error);
        process.exit(1);
    }
};

updateDashboardLinksTable();
