const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const routes = require('./routes');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const port = 3000;

app.use(express.static("public"));

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'JWT Auth API',
            version: '1.0.0',
            description: 'API Documentation for JWT Authentication Project',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./routes.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

connectDB().then(() => {
    app.listen(port , () => console.log(`🚀 Server running on port ${port}`));
});

app.use("/", routes);