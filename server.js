const express = require('express');
const fileUpload = require('express-fileupload');
var cors = require("cors");
const app = express();

// Then use it before your routes are set up:
app.use(cors());
app.use(fileUpload());

//Import Routes
const categoriesRoute = require('./routes/categories');
const productsRoute = require('./routes/products');
const usersRoute = require('./routes/users');
const gulpsampleRoute = require('./routes/gulpsample');

const ordersRoute = require('./routes/orders');


// Middleware
app.use(express.json());


// Route Middlewares
app.use('/categories', categoriesRoute);
app.use('/products', productsRoute);
app.use('/users', usersRoute);
app.use('/gulpsample', gulpsampleRoute);

app.use('/orders', ordersRoute);

app.listen(5000, () => console.log('Server Started at Port 5000...'));
