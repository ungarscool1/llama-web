import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { auth } from 'express-openid-connect';

const router = require('./routes');
const chat = require('./routes/chat');

dotenv.config();

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

if (process.env.SKIP_AUTH === 'false' && !process.env.ISSUER && !process.env.CLIENT_ID && !process.env.CLIENT_SECRET && !process.env.BASE_URL) {
  throw new Error('ISSUER must be set when auth is required');
} else if (!process.env.LLAMA_PATH) {
  throw new Error('LLAMA_PATH must be set');
}

const config = {
  authRequired: process.env.SKIP_AUTH === 'false',
  issuerBaseURL: process.env.ISSUER,
  clientID: process.env.CLIENT_ID,
  secret: process.env.CLIENT_SECRET,
  baseURL: process.env.BASE_URL,
};

const port = process.env.PORT || 3000;
if (!config.baseURL && !process.env.BASE_URL && process.env.PORT && process.env.NODE_ENV !== 'production') {
  config.baseURL = `https://localhost`;
}

app.use(auth(config));

// Middleware to make the `user` object available for all views
app.use(function (req, res, next) {
  res.locals.user = req.oidc.user;
  next();
});

app.use('/', router);
app.use('/chat', chat);

/*// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handlers
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: process.env.NODE_ENV !== 'production' ? err : {}
  });
});*/

app.listen(port, () => {
  console.log(`Listening on ${config.baseURL}`);
});