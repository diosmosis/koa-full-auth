'use strict';

import jwt from 'jsonwebtoken';

async function setSecret(
  {
    userStore,
    jwtSecret,
    jwtSigningOptions,
  } = {},
  ctx,
  next,
) {
  const authorization = ctx.request.headers.authorization;
  if (!authorization) {
    await next();
    return;
  }

  const token = authorization.substring('Bearer '.length);

  const email = jwt.decode(token, jwtSigningOptions).email;
  if (!email) {
    await next();
    return;
  }

  const user = await userStore.getUser(email);
  ctx.state.secret = jwtSecret + user.passwordHash;

  await next();
}

setSecret.middleware = function createSetSecretMiddleware(options) {
  return async (ctx, next) => setSecret(options, ctx, next);
};

export default setSecret;
