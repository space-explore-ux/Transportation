const express = require("express");

const path = require("path");

const hbs = require("hbs");

const bodyParser = require('body-parser');

const session = require('express-session');

const app = express();


// Session mgmt

app.use(session({
  secret: 'your_secret_key', // use a strong secret key in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set true if using https
}));


const location = path.join(__dirname,"./public");
app.use(express.static(location));

app.set("view engine", "hbs");

const partialsPath =  path.join(__dirname , "./views/partials");
hbs.registerPartials(partialsPath);


hbs.registerHelper('add', function(value, addition) {
    return value + addition;
});

app.use(express.urlencoded({ extended:false})); 

app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", require("./routes/pages"));

app.use("/auth", require("./routes/auth"));


app.listen(5000, () => 
     {
         console.log("Server Started At Port 5000");
 });   
