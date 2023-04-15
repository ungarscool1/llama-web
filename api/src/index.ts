import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import ORM from './models/init';
import {middleware} from './middleware';
import cors from 'cors';
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

const router = require('./routes');
const chat = require('./routes/chat');

dotenv.config();

const app = express();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
      new ProfilingIntegration()
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'production'
  });
  Sentry.configureScope((scope) => {
    scope.addEventProcessor((event) => {
      delete event.request?.data;
      return event;
    });
  });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

if (process.env.SKIP_AUTH === 'false' && !process.env.ISSUER && !process.env.CLIENT_ID && !process.env.CLIENT_SECRET && !process.env.BASE_URL) {
  throw new Error('ISSUER must be set when auth is required');
} else if (!process.env.LLAMA_PATH) {
  throw new Error('LLAMA_PATH must be set');
} else if (!process.env.DB) {
  throw new Error('DB must be set');
}

ORM();

const port = process.env.PORT || 3000;

app.use(middleware);

app.use('/', router);
app.use('/chat', chat);

if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).json({ message: 'Not Found' });
});

/*
// Error handlers
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: process.env.NODE_ENV !== 'production' ? err : {}
  });
});*/

app.listen(port, () => {
  console.log(`Listening on localhost:${port}`);
});