'use strict';

import Koa from 'koa';
import fullAuthMiddleware from '..';

export default function startTestServer(options = {}) {
  const app = new Koa();
  app.use(fullAuthMiddleware(options));
  return app.listen(3000);
}
