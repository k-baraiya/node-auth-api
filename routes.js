const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('./db');

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

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *               - email
 *               - password
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               age:
 *                 type: integer
 *                 example: 25
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: securePassword123
 *               location:
 *                 type: string
 *                 example: New York
 *     responses:
 *       201:
 *         description: User Registered Successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User Registered Successfully 
 *       400:
 *         description: Invalid input or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All fields are required.
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email already exists
 */
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
        const checkUser = await pool.query(`
                          SELECT * 
                          FROM "userTable" 
                          WHERE email = $1 
                          `, [email]);
        
        if(checkUser.rows.length)
        {
            return res.status(409).send({ message : "Email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password , 10);

        await pool.query(`
            INSERT INTO "userTable" 
            (name, age, email, password, location) 
            VALUES ($1, $2, $3, $4, $5)
        `, [name, age, email, hashedPassword, location]);

        res.status(201).send({ message: "User Registered Successfully " });
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({error: err.message});
    }
});


//----------------------------------- Login   -------------------------------------

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Login Successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login Successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Email & Password are required / Invalid email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email & Password are required...
 *       401:
 *         description: Invalid Email or Password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid Email or Password
 */
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
        const result = await pool.query(`
                       SELECT * 
                       FROM "userTable" 
                       WHERE email = $1
                       `, [email]);

        if (!result.rows.length)
        {
            return res.status(401).send({ message: "Invalid Email or Password" });
        }

        const user = result.rows[0];

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

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get user details
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: John Doe
 *                 age:
 *                   type: integer
 *                   example: 25
 *                 email:
 *                   type: string
 *                   example: john@example.com
 *                 location:
 *                   type: string
 *                   example: New York
 *       401:
 *         description: Unauthorized - Token Missing or Invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token Missing
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 */
router.get("/user", authenticateToken , async (req,res) => {
    try 
    {
        const userId = req.user.id;

        const result = await pool.query(`
                       SELECT id, name, age, email, location 
                       FROM "userTable" 
                       WHERE id = $1
                       `, [userId]);

        if(!result.rows.length)
        {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send(result.rows[0]);
    }
    catch(err)
    {
        res.status(500).send({ error: err.message });
    }
});


// -------------------------------------    Update User ------------------------------------------

/**
 * @swagger
 * /user:
 *   put:
 *     summary: Update user details
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Smith
 *               age:
 *                 type: integer
 *                 example: 26
 *               location:
 *                 type: string
 *                 example: San Francisco
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *       400:
 *         description: Invalid input or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All fields are required
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Access Denied
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 */
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

        const result = await pool.query(`
            UPDATE "userTable"
            SET name = $1, age = $2, location = $3
            WHERE id = $4
        `, [name, age, location, userId]);

        if(result.rowCount === 0)
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

/**
 * @swagger
 * /user:
 *   delete:
 *     summary: Delete a user
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Access Denied
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 */
router.delete("/user" , authenticateToken , async (req,res) => {
    
    try
    {
        const userId = req.user.id;

        const result = await pool.query(`
                       DELETE FROM "userTable" 
                       WHERE id = $1 
                       `, [userId]);

        if (result.rowCount === 0)
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
