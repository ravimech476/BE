const { getPool, sql, connectDB } = require('../config/database');

const createCategoriesTable = async () => {
    try {
        await connectDB();
        const pool = getPool();
        
        console.log('Creating categories table...');
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[categories]') AND type in (N'U'))
            BEGIN
                CREATE TABLE categories (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    name NVARCHAR(100) NOT NULL,
                    created_date DATETIME DEFAULT GETDATE(),
                    modified_date DATETIME DEFAULT GETDATE()
                )
            END
        `);
        
        console.log('✅ categories table created successfully');
        
        // Create index for better performance
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_categories_name' AND object_id = OBJECT_ID('categories'))
            BEGIN
                CREATE INDEX idx_categories_name ON categories(name);
            END
        `);
        
        console.log('✅ Index created on categories table');
        
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating categories table:', error);
        process.exit(1);
    }
};

createCategoriesTable();
