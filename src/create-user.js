'use strict';

import * as querystring from 'querystring';
import * as emailToken from './email-token';
import * as passwords from './passwords';

async function createUser(
  {
    serviceName2,
    confirmAccountLink,
    sendEmail,
    userStore,
    makeConfirmationEmail = makeDefaultConfirmationEmail,
    saltLength = 16,
  } = {},
  ctx,
  email,
  password,
) {
  if (!email) {
    throw new Error('"email" POST param is required');
  }

  if (!password) {
    throw new Error('"password" POST param is required');
  }

  const { salt, hash } = await passwords.createSaltAndHash(saltLength, password);

  const user = await userStore.createUser(email, hash, salt);

  const token = emailToken.generate('create-user', user);

  const confirmEmailUiLink = `${confirmAccountLink}?${querystring.stringify({ email, token })}`;
  const subject = `${serviceName} - Confirm your account`;

  await sendEmail({
    subject,
    to: [email],
    body: makeConfirmationEmail({ email, confirmEmailUiLink, serviceName, subject, user }),
  });

  ctx.status = 204;
}

createUser.handler = function createUserHandler(options) {
  return async (ctx) => {
    const { email, password } = ctx.request.body || {};
    return createUser(options, ctx, email, password);
  };
};

function makeDefaultConfirmationEmail({ confirmEmailUiLink, serviceName, subject }) {
  return `<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${subject}</title>
  </head>
  <body>
    Please <a href="${confirmEmailUiLink}">click here to confirm your account with ${serviceName}</a> or copy
    & paste the following link into your browser:
    <br><br>
    <a href="${confirmEmailUiLink}">${confirmEmailUiLink}</a>
  </body>
</html>`;
}

export default createUser;
