const sql = require('mssql');

const config = {
    user: "sa",
    password: "admin",
    server: "Krishna",
    database: "usersDB",
    options: {trustServerCertificate: true}
};

sql.on('error' , err => console.log("SQL Error" , err));

async function connectDB()
{
    try
    {
        await sql.connect(config);
        console.log("✅ Connected to MSSQL");
    }
    catch(err)
    {
        console.log("❌ DB Connection Error: " , err);
        throw err;
    }
}

module.exports = { sql, connectDB };
