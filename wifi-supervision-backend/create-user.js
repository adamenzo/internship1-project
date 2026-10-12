const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}).promise();

async function createUser(email, password, nom, prenom, roleId = 2) { // Default role 2, assuming 1 is admin
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            'INSERT INTO users (email, password, nom, prenom, role_id) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, nom, prenom, roleId]
        );

        console.log('✅ User created successfully');
        console.log('ID:', result.insertId);
        console.log('Email:', email);

        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

// Usage: node create-user.js email password nom prenom [roleId]
const [,, email, password, nom, prenom, roleId] = process.argv;
if (!email || !password || !nom || !prenom) {
    console.log('Usage: node create-user.js <email> <password> <nom> <prenom> [roleId]');
    process.exit(1);
}

createUser(email, password, nom, prenom, roleId || 2);