"use strict";

var xml = fs.readFileSync('service.wsdl', 'utf8');

var soap = require('soap');
var fs = require('fs');

const express = require("express"), 
  app = express(),
  mongoose = require("mongoose"),
  ejs = require("ejs"),
  session = require("express-session"),
  passport = require("passport"),
  multer = require("multer"),
  uid = require("uid"),
  path = require("path"), 
  sanitizer = require("express-sanitizer"),
  methodOverride = require("method-override"),
  localStrategy = require("passport-local"),
  MongoStore = require("connect-mongodb-session")(session),
  flash = require("connect-flash"),
  crypto = require("crypto"),
  User = require("./models/user"),
  userRoutes = require("./routes/users"),
  adminRoutes = require("./routes/admin"), 
  bookRoutes = require("./routes/books"),
  authRoutes = require("./routes/auth");
  app.use(session({ secret: 'somevalue' }));
  var http = require('http'); 

if (process.env.NODE_ENV !== "production") require("dotenv").config();

app.engine(".html", ejs.renderFile);
app.set("view engine", "html"); 
app.set("views", path.join(__dirname, "views")); 

app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizer());

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("MongoDB is connected"))
  .catch((error) => console.log(error));

const store = new MongoStore({
  uri: process.env.DB_URL,
  collection: "sessions",
});

app.use(
  session({   
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    store,
  })
);

app.use(flash());
app.use(passport.initialize()); 
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, `${crypto.randomBytes(12).toString("hex")}-${file.originalname}`);
  },
});

const filefilter = (req, file, cb) => {
  if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(multer({ storage: fileStorage, fileFilter: filefilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.warning = req.flash("warning");
  next();
});

app.use(userRoutes);
app.use(adminRoutes);
app.use(bookRoutes);
app.use(authRoutes);

const PORT = process.env.PORT || 3000;

  app.set('port', process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`server is running at http://localhost:${PORT}`);
});


 if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var port = 5000;
app.listen(port, function () {
  console.log('Listening on port ' + port);
  var wsdl_path = "/wsdl";
  soap.listen(app, wsdl_path, serviceObject, xml);
  console.log("Check http://localhost:" + port + wsdl_path +"?wsdl to see if the service is working");
});
 

