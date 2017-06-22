'use strict';

import * as emailToken from './email-token';
import * as passwords from './passwords';

async function changePassword(
  {
    userStore,
  } = {},
  ctx,
  email,
  token,
  newPassword,
) {
  const user = await userStore.getUser(email);
  if (!user) {
    invalidToken();
    return;
  }

  if (!emailToken.isValidToken(token, 'change-password', user)) {
    invalidToken();
    return;
  }

  user.passwordHash = await passwords.computeHash(newPassword, user.salt);

  await userStore.saveUser(user);

  ctx.status = 204;

  function invalidToken() {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid or expired token.',
    };
  }
}

changePassword.handler = function changePasswordHandler(options) {
  return async (ctx) => {
    const { email, token, newPassword } = ctx.request.body;
    return changePassword(options, ctx, email, token, newPassword);
  };
};

export default changePassword;
