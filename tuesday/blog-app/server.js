// Main file - sets up Pug, connects the routes, starts the server

const express = require('express');
const postRoutes = require('./routes/postRoutes');

const app = express();

// 1. tell Express to use Pug as the template engine
app.set('view engine', 'pug');

// 2. tell Express where the .pug files live
app.set('views', './views');

// 3. read data sent by an HTML form into req.body
//    (forms send urlencoded data, not JSON)
app.use(express.urlencoded({ extended: true }));

// 4. connect the routes
app.use('/', postRoutes);

app.listen(3000, () => {
  console.log('Blog running on http://localhost:3000');
});
