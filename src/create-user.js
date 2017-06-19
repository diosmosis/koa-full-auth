'use strict';

import * as querystring from 'querystring';
import * as crypto from 'crypto';
import promisify from 'es6-promisify';
import * as confirmLinkToken from './confirm-link-token';

const PBKDF2_ITERATIONS = 4096;
const PBKDF2_DIGEST = 'sha512';

const randomBytes = promisify(crypto.randomBytes);
const pbkdf2 = promisify(crypto.pbkdf2);

export default async function createUser(ctx, {
  serviceName,
  confirmAccountLink,
  sendEmail,
  userStore,
  makeConfirmationEmail = makeDefaultConfirmationEmail,
  saltLength = 16,
} = {}) {
  const { email, password } = ctx.request.body || {};

  if (!email) {
    throw new Error('"email" POST param is required');
  }

  if (!password) {
    throw new Error('"password" POST param is required');
  }

  const { salt, hash } = await createSaltAndHash(saltLength, password);

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

async function createSaltAndHash(saltLength, password) {
  const salt = await randomBytes(saltLength);
  const hash = (await pbkdf2(password, salt, PBKDF2_ITERATIONS, saltLength, PBKDF2_DIGEST));
  return { salt: salt.toString('hex'), hash: hash.toString('hex') };
}
