require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

async function connectDB() {
    try {
        const client = await pool.connect();
        console.log("✅ Connected to PostgreSQL");
        client.release();
    } catch (err) {
        console.log("❌ DB Connection Error: ", err);
        throw err;
    }
}

module.exports = { pool, connectDB };
