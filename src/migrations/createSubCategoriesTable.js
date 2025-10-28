const { getPool, sql, connectDB } = require('../config/database');

const createSubCategoriesTable = async () => {
    try {
        await connectDB();
        const pool = getPool();
        
        console.log('Creating subcategories table...');
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[subcategories]') AND type in (N'U'))
            BEGIN
                CREATE TABLE subcategories (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    category_id INT NOT NULL,
                    name NVARCHAR(100) NOT NULL,
                    created_date DATETIME DEFAULT GETDATE(),
                    modified_date DATETIME DEFAULT GETDATE(),
                    CONSTRAINT FK_subcategories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
                )
            END
        `);
        
        console.log('✅ subcategories table created successfully');
        
        // Create indexes for better performance
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_subcategories_category_id' AND object_id = OBJECT_ID('subcategories'))
            BEGIN
                CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
            END
            
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_subcategories_name' AND object_id = OBJECT_ID('subcategories'))
            BEGIN
                CREATE INDEX idx_subcategories_name ON subcategories(name);
            END
        `);
        
        console.log('✅ Indexes created on subcategories table');
        
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating subcategories table:', error);
        process.exit(1);
    }
};

createSubCategoriesTable();
