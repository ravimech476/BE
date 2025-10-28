const { getPool, sql, connectDB } = require('../config/database');

async function createHeroSectionTable() {
    try {
        // Connect to database first
        await connectDB();
        
        const pool = getPool();
        
        console.log('Creating hero_section table...');
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[hero_section]') AND type in (N'U'))
            BEGIN
                CREATE TABLE hero_section (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    title NVARCHAR(MAX) NOT NULL,
                    image NVARCHAR(500) NULL,
                    is_active BIT DEFAULT 1,
                    created_by INT NOT NULL,
                    created_date DATETIME DEFAULT GETDATE(),
                    modified_date DATETIME DEFAULT GETDATE(),
                    CONSTRAINT FK_hero_section_created_by FOREIGN KEY (created_by) REFERENCES tbl_users(id)
                )
            END
        `);
        
        console.log('✅ hero_section table created successfully!');
        
        // Insert a default hero section
        const defaultHero = await pool.request()
            .query(`SELECT COUNT(*) as count FROM hero_section`);
        
        if (defaultHero.recordset[0].count === 0) {
            console.log('Inserting default hero section...');
            
            // Get first admin user
            const adminUser = await pool.request()
                .query(`SELECT TOP 1 id FROM tbl_users WHERE role = 'admin'`);
            
            if (adminUser.recordset.length > 0) {
                await pool.request()
                    .input('title', sql.NVarChar, 'Group of company has created to do work for various sectors like the electronics and Raw materials about flowers')
                    .input('image', sql.NVarChar, 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1600&h=400&fit=crop')
                    .input('created_by', sql.Int, adminUser.recordset[0].id)
                    .query(`
                        INSERT INTO hero_section (title, image, is_active, created_by)
                        VALUES (@title, @image, 1, @created_by)
                    `);
                
                console.log('✅ Default hero section inserted!');
            } else {
                console.log('⚠️ No admin user found. Skipping default hero section.');
            }
        } else {
            console.log('✅ Hero section data already exists');
        }
        
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating hero_section table:', error);
        process.exit(1);
    }
}

createHeroSectionTable();
