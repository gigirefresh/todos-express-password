var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var crypto = require('crypto');

// In-memory session store
const sessions = {};

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');

var app = express();

// Make sessions object available to routes
app.set('sessions', sessions); // or app.locals.sessions = sessions;

// Middleware to parse cookies and manage sessions
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      req.cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
    });
  }

  const sessionId = req.cookies.sessionId;
  if (sessionId && sessions[sessionId]) {
    req.user = sessions[sessionId].user;
    req.session = sessions[sessionId]; // Make the whole session object available
    req.sessionId = sessionId;
  } else {
    // Create a new session object for every request if no valid session exists
    // This allows routes to potentially store flash messages or other temporary data
    // even for unauthenticated users, though we are not explicitly using that here yet.
    req.session = {};
  }
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.locals.pluralize = require('pluralize');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
