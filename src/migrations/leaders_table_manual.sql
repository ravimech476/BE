-- Leaders Table Schema
-- Run this if the migration script fails or you want to create manually

-- Create leaders table
CREATE TABLE leaders (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(200) NOT NULL,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    image NVARCHAR(500),
    icon NVARCHAR(100),
    display_order INT DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'active',
    created_date DATETIME DEFAULT GETDATE(),
    modified_date DATETIME DEFAULT GETDATE(),
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES tbl_users(id)
);

-- Create index for better performance
CREATE INDEX idx_leaders_status ON leaders(status);

-- Sample data (optional)
INSERT INTO leaders (name, title, description, icon, display_order, status, created_by)
VALUES 
    ('John Doe', 'Chief Executive Officer', 'Leading the company with 20+ years of experience in the industry.', '👔', 1, 'active', 1),
    ('Jane Smith', 'Chief Financial Officer', 'Managing financial operations and strategic planning.', '💼', 2, 'active', 1),
    ('Mike Johnson', 'Chief Technology Officer', 'Driving innovation and technology transformation.', '💻', 3, 'active', 1);

-- Check table structure
SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'leaders';

-- View all leaders
SELECT * FROM leaders ORDER BY display_order ASC;

-- Drop table if needed (BE CAREFUL!)
-- DROP TABLE leaders;
