var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
var session = require("express-session");
const bodyparser = require('body-parser')

var authRouter = require("./routes/auth");
var usersRouter = require("./routes/users");
var importRouter = require("./routes/importExcel");
var emailRouter = require("./routes/sendEmail");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "0dc529ba-5051-4cd6-8b67-c9a901bb8bdf",
    resave: false,
    saveUninitialized: false,
  })
);

//use express static folder
app.use(express.static("./public"))
// body-parser middleware use
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
    extended: true
}))

const db = require("./models");
db.sequelize
  .sync()
  .then(() => {
    console.log("sync db");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.use("/", authRouter);
app.use("/send-email", emailRouter);
app.use("/users", usersRouter);
app.use("/contact", importRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
