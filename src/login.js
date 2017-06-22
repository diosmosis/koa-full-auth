'use strict';

import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as passwords from './passwords';

async function login(
  {
    userStore,
    jwtSecret,
  } = {},
  ctx,
  email,
  password,
) {
  const user = await userStore.getUser(email);
  if (!user || !user.confirmed) {
    ctx.status = 401;
    ctx.body = {
      error: 'Invalid email or password.',
    };

    return;
  }

  const hash = await passwords.computeHash(password, user.salt);
  if (!crypto.timingSafeEqual(Buffer.from(hash, 'ascii'), Buffer.from(user.passwordHash, 'ascii'))) {
    ctx.status = 401;
    ctx.body = {
      error: 'Invalid email or password.',
    };

    return;
  }

  ctx.status = 200;
  ctx.body = {
    token: jwt.sign({ email }, jwtSecret),
  };
}

login.handler = function createLoginHandler(options) {
  return async (ctx) => {
    const { email, password } = ctx.request.body || {};
    return login(options, ctx, email, password);
  };
};

export default login;
