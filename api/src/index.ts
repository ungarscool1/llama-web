import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import ORM from './models/init';
import {anonymousMiddleware, middleware} from './middleware';
import cors from 'cors';
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

dotenv.config();

import router from './routes';
import chat from './routes/chat';
import textCompletionRouter from './routes/playground/completion';
import embeddingsRouter from './routes/playground/embeddings';
import customChatRouter from './routes/playground/chat';
import settingsRouter from './routes/settings';
import modelsRouter from './routes/models';
import systemRouter from './routes/system';
import sharedChatRouter from './routes/sharedChat';

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
      event.user = {
        username: event.user?.username,
      };
      return event;
    });
  });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

if ((process.env.SKIP_AUTH === 'false' || !process.env.SKIP_AUTH) && (!process.env.JWT_PUBLIC_KEY || process.env.JWT_PUBLIC_KEY.length === 0)) {
  throw new Error('JWT_PUBLIC_KEY must be set when auth is required');
} else if (!process.env.LLAMA_PATH || !process.env.MODELS_DIR || !process.env.LLAMA_EMBEDDING_PATH) {
  throw new Error('LLAMA environment variables must be set');
} else if (!process.env.DB) {
  throw new Error('DB must be set');
}

ORM();

const port = process.env.PORT || 3000;

if (process.env.SKIP_AUTH === 'false' || !process.env.SKIP_AUTH) {
  app.use(middleware);
} else {
  console.warn('Skipping auth');
  app.use(anonymousMiddleware);
}

app.use('/', router);
app.use('/chat', chat);
app.use('/text-completion', textCompletionRouter);
app.use('/embeddings', embeddingsRouter);
app.use('/custom-chat', customChatRouter);
app.use('/settings', settingsRouter);
app.use('/models', modelsRouter);
app.use('/system', systemRouter);
app.use('/shared', sharedChatRouter);


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