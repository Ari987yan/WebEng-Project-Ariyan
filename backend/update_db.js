const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function updateDB() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'attendance_system'
    });

    try {
        console.log("Checking if status column exists in Users table...");
        const [columns] = await pool.query("SHOW COLUMNS FROM Users LIKE 'status'");
        if (columns.length === 0) {
            console.log("Adding status column...");
            await pool.query("ALTER TABLE Users ADD COLUMN status ENUM('Active', 'On Leave', 'Inactive') DEFAULT 'Active'");
            console.log("Column added.");
        } else {
            console.log("Status column already exists.");
        }

        console.log("Creating Settings table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                school_name VARCHAR(255) DEFAULT 'Global International School',
                academic_year VARCHAR(50) DEFAULT '2025-2026',
                system_email VARCHAR(255) DEFAULT 'admin@sams.edu'
            )
        `);
        console.log("Settings table created.");

        console.log("Inserting default settings...");
        await pool.query(`
            INSERT IGNORE INTO Settings (id, school_name, academic_year, system_email) 
            VALUES (1, 'Global International School', '2025-2026', 'admin@sams.edu')
        `);
        console.log("Default settings inserted.");

    } catch (error) {
        console.error("Error updating database:", error);
    } finally {
        pool.end();
    }
}

updateDB();
