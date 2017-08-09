'use strict';

import jwt from 'jsonwebtoken';
import promisify from 'es6-promisify';

const signAsync = promisify(jwt.sign);

async function reSign(
  {
    jwtSigningOptions,
  } = {},
  ctx,
  next,
) {
  if (!ctx.state.user) {
    await next();
    return;
  }

  const newTokenClaims = Object.assign({}, ctx.state.user);

  // remove special JWT claims that will be overridden
  delete newTokenClaims.iat;
  delete newTokenClaims.exp;
  delete newTokenClaims.nbf;
  delete newTokenClaims.jti;

  const token = await signAsync(newTokenClaims, ctx.state.secret, jwtSigningOptions || {});
  ctx.set('Authorization', `Bearer ${token}`);

  await next();
}

reSign.middleware = function createReSignMiddleware(options) {
  return async (ctx, next) => reSign(options, ctx, next);
};

export default reSign;
