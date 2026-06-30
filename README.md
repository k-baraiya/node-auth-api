# Node.js JWT Authentication API

A lightweight, secure REST API built with Node.js, Express, and Microsoft SQL Server (MSSQL), featuring JWT-based authentication and user management.

## Features

- **User Registration** with secure password hashing (bcrypt).
- **User Authentication** issuing JSON Web Tokens (JWT).
- **CRUD Operations** for user profiles securely protected by JWT middleware.
- **Modular Structure** separating routing, database connection, and server logic.

## Prerequisites

- [Node.js](https://nodejs.org/) installed
- An instance of Microsoft SQL Server (MSSQL) running

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Database Configuration:**
   Update the database configuration in `db.js` with your MSSQL credentials:
   ```javascript
   const config = {
       user: "your_username",
       password: "your_password",
       server: "your_server_name",
       database: "usersDB",
       options: { trustServerCertificate: true }
   };
   ```
   Ensure a table named `userTable` exists with fields like `id`, `name`, `age`, `email`, `password`, and `location`.

3. **Start the server:**
   ```bash
   node server.js
   ```

## API Endpoints

- `POST /signup` - Register a new user
- `POST /login` - Authenticate a user and receive a JWT token
- `GET /user` - Get the profile of the authenticated user
- `PUT /user` - Update the profile of the authenticated user
- `DELETE /user` - Delete the authenticated user account

## Technologies

- Node.js
- JavaScript
- Express
- mssql
- jsonwebtoken
- bcrypt
