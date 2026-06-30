const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sql } = require('./db');

const JWT_SECRET = "my_secret_key";

router.get("/" , (req,res) => {
    res.send("Hello");
});

//--------------------- JWT Middleware  -----------------------------------

async function authenticateToken(req, res, next)
{ 
    try
    {
        // const authHeader = req.headers.authorization;
        const authHeader = req.headers["authorization"];

        if (!authHeader)
        {
            return res.status(401).send({ message: "Token Missing" });
        }

        if (!authHeader.startsWith("Bearer "))
        {
            return res.status(401).send({ message: "Invalid token format" });
        }

        const token = authHeader.split(" ")[1];
       
        if (!token)
        {
            return res.status(401).send({ message: "Access Denied" }); 
            // Invalid Token Format
        }

        const decoded = jwt.verify(token , JWT_SECRET);
        
        // console.log({decoded})
        
        req.user = decoded;
        
        next();

    }

    catch(err)
    {
        return res.status(403).send({ message: "Invalid or Expired Token" })
    }    
    
}

//------------------------- Sign-up ---------------------------------------

router.post("/signup" , async (req,res) => {

    try
    {
        const { name , age , email , password , location } = req.body;

        // Field Validations
        if(!name?.trim() ||
            age === undefined ||
            !email?.trim() ||
            !password?.trim() ||
            !location?.trim()
        )
        {
            return res.status(400).send({ message: "All fields are required." });
        }

        // Age Validation
        if(isNaN(age) || age < 1 || age > 100)
        {
            return res.status(400).send({ message: "Invalid age" });
        }

        // Password Validation
        if(password.length < 6)
        {
            return res.status(400).send({ message: "Password must be at least 6 characters" });
        }

        // Email Validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if(!emailRegex.test(email))
        {
            return res.status(400).send({ message: "Invalid email" });
        }

        // Email Existes or not
        const checkUser = await sql.query `
                          SELECT * 
                          FROM userTable 
                          WHERE email = ${email} 
                          `;
        
        if(checkUser.recordset.length)
        {
            return res.status(409).send({ message : "Email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password , 10);

        await sql.query
        `INSERT INTO userTable 
        (name, age , email , password , location) 
        VALUES (${name} , ${age} , ${email} , ${hashedPassword} , ${location})
        `;

        res.status(201).send({ message: "User Registered Successfully " });
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({error: err.message});
    }
});


//----------------------------------- Login   -------------------------------------

router.post("/login" , async (req,res) => {

    try
    {
        const {email , password} = req.body;

        if(!email?.trim() || !password?.trim())
        {
            return res.status(400).send({ message: "Email & Password are required..." });
        }

        // Email Validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if(!emailRegex.test(email))
        {
            return res.status(400).send({ message: "Invalid email" });
        }

        // Find user by email
        const result = await sql.query`
                       SELECT * 
                       FROM userTable 
                       WHERE email = ${email}
                       `;

        if (!result.recordset.length)
        {
            return res.status(401).send({ message: "Invalid Email or Password" });
        }

        const user = result.recordset[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch)
        {
            return res.status(401).send({ message: "Invalid Email or Password" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            {id: user.id } ,
            JWT_SECRET ,
            {expiresIn: "1h"}
        );

        res.status(200).send({
            message: "Login Successful" , 
            token 
        });
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({ error: err.message })
    }
});

// ------------------------------------------    Get User    --------------------------------------------------

router.get("/user", authenticateToken , async (req,res) => {
    try 
    {
        const userId = req.user.id;

        const result = await sql.query`
                       SELECT id, name, age, email, location 
                       FROM userTable 
                       WHERE id = ${userId}
                       `;

        if(!result.recordset.length)
        {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send(result.recordset[0]);
    }
    catch(err)
    {
        res.status(500).send({ error: err.message });
    }
});


// -------------------------------------    Update User ------------------------------------------

router.put("/user" , authenticateToken , async (req,res) => {
    
    try
    {
        const userId = req.user.id;

        const { name, age, location } = req.body;

        if ( !name?.trim() ||
             age === undefined ||
             !location?.trim()
        )
        {
            return res.status(400).send({ message: "All fields are required" });
        }

        if (isNaN(age) || age < 1 || age > 100)
        {
            return res.status(400).send({
                message: "Invalid age"
            });
        }

        const result = await sql.query` UPDATE userTable
                                        SET
                                                name = ${name},
                                                age = ${age},
                                                location = ${location}
                                            WHERE id = ${userId}
        `;

        if(result.rowsAffected[0] === 0)
        {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send({ message: "User updated successfully" });
    }
    catch (err)
    {
        res.status(500).send({ error: err.message });
    }
});

// -------------------------------- Delete User ------------------------------------------

router.delete("/user" , authenticateToken , async (req,res) => {
    
    try
    {
        const userId = req.user.id;

        const result = await sql.query`
                       DELETE FROM userTable 
                        WHERE id = ${userId} 
                       `;

        if (result.rowsAffected[0] === 0)
        {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send({ message: "User deleted successfully" });
    }
    catch (err)
    {
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
