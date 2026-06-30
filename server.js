const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const routes = require('./routes');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const port = 3000;

app.use(express.static("public"));

connectDB().then(() => {
    app.listen(port , () => console.log(`🚀 Server running on port ${port}`));
});

app.use("/", routes);