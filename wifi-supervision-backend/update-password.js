const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}).promise();

async function updatePassword(email, newPassword) {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [result] = await pool.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        if (result.affectedRows > 0) {
            console.log('✅ Password updated successfully');
            console.log('Email:', email);
            console.log('New Password:', newPassword);
        } else {
            console.log('❌ User not found');
        }

        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

// Usage: node update-password.js email newPassword
const [,, email, newPassword] = process.argv;
if (!email || !newPassword) {
    console.log('Usage: node update-password.js <email> <newPassword>');
    process.exit(1);
}

updatePassword(email, newPassword);