'use strict';

import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import promisify from 'es6-promisify';
import * as passwords from './passwords';

const signAsync = promisify(jwt.sign);

async function login(
  {
    userStore,
    jwtSecret,
    jwtSigningOptions,
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

  const token = await signAsync({ email }, jwtSecret + user.passwordHash, jwtSigningOptions || {});

  ctx.status = 200;
  ctx.body = {
    token,
  };
}

login.handler = function createLoginHandler(options) {
  return async (ctx) => {
    const { email, password } = ctx.request.body || {};
    return login(options, ctx, email, password);
  };
};

export default login;
