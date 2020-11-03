const express = require('express');
var cors = require("cors");
const app = express();

// Then use it before your routes are set up:
app.use(cors());

//Import Routes
const categoriesRoute = require('./routes/categories');
const productsRoute = require('./routes/products');
const usersRoute = require('./routes/users');

// Middleware
app.use(express.json());


// Route Middlewares
app.use('/categories', categoriesRoute);
app.use('/products', productsRoute);
app.use('/users', usersRoute);


app.listen(5000, () => console.log('Server Started at Port 5000...'));
