'use strict';

import * as querystring from 'querystring';
import * as confirmLinkToken from './confirm-link-token';
import * as passwords from './passwords';

export default function createUser({
  serviceName,
  confirmAccountLink,
  sendEmail,
  userStore,
  makeConfirmationEmail = makeDefaultConfirmationEmail,
  saltLength = 16,
} = {}) {
  return async (ctx) => {
    const { email, password } = ctx.request.body || {};

    if (!email) {
      throw new Error('"email" POST param is required');
    }

    if (!password) {
      throw new Error('"password" POST param is required');
    }

    const { salt, hash } = await passwords.createSaltAndHash(saltLength, password);

    await userStore.saveUser(email, hash, salt);

    const token = confirmLinkToken.generate(email, hash, salt);

    const confirmEmailUiLink = `${confirmAccountLink}?${querystring.stringify({ email, token })}`;
    const subject = `${serviceName}: Confirm your account`;

    await sendEmail({
      subject,
      to: [email],
      body: makeConfirmationEmail({ email, confirmEmailUiLink, serviceName, subject }),
    });

    ctx.status = 204;
  };
}

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
