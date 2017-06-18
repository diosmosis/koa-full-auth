'use strict';

export default function fullAuthMiddlewareFactory(options = {}) {
  return fullAuthMiddleware.bind(null, options);
}

async function fullAuthMiddleware(options, ctx, next) {
  await next();
}
