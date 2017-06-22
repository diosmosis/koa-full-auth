'use strict';

import * as emailToken from './email-token';

async function confirmUser(
  {
    userStore,
  } = {},
  ctx,
  email,
  token,
) {
  const user = await userStore.getUser(email);
  if (!user) {
    invalidToken();
    return;
  }

  if (!emailToken.isValidToken(token, 'create-user', user)) {
    invalidToken();
    return;
  }

  if (!user.confirmed) {
    user.confirmed = true;
    await userStore.saveUser(user);
  }

  ctx.status = 204;

  function invalidToken() {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid or expired token.',
    };
  }
}

confirmUser.handler = function confirmUserHandler(options) {
  return async (ctx) => {
    const { email, token } = ctx.request.body;
    return confirmUser(options, ctx, email, token);
  };
};

export default confirmUser;
