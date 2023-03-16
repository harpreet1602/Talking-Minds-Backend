const express = require('express');
const app= express();
const dotenv=require('dotenv');
const port = process.env.PORT || 5000;
const mongoose=require('mongoose');

//IMPORT ROUTES
const authRoute=require('./routes/auth');
const profileRoute=require('./routes/profile');
const postRoute=require('./routes/posts');
const cors = require("cors");
dotenv.config();

//Connect to DB
try {
mongoose.connect(process.env.DB_CONNECT,{ useNewUrlParser: true, useUnifiedTopology: true },() => console.log('Connected to Database'));
}
catch (error) {
    handleError(error);
    console.log(error);
  }

//MIDDLEWARES
app.use(express.json());
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*")
// })
var corsOptions = {
  origin: "http://localhost:3000"
};

app.use(cors(corsOptions));

// ROUTE MIDDLESWARES
app.use('/api/user',authRoute);
app.use('/api/profile',profileRoute);
app.use('/api/posts',postRoute);

app.listen(port,() => {
    console.log(`Server is running at Port Number ${port}`);
});