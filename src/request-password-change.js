'use strict';

import * as querystring from 'querystring';
import * as emailToken from './email-token';

async function requestPasswordChange(
  {
    serviceName,
    sendEmail,
    resetPasswordLink,
    userStore,
    makeRequestPasswordResetEmail = makeDefaultRequestPasswordResetEmail,
  } = {},
  ctx,
  email,
) {
  const user = await userStore.getUser(email);
  if (!user) {
    // no user found, but don't say so, otherwise attackers could use this to
    // find if an email is in the system
    finish();
    return;
  }

  const token = emailToken.generate('change-password', user);

  const resetPasswordEmailUiLink =
    `${resetPasswordLink}?${querystring.stringify({ email, token })}`;
  const subject = `${serviceName} - Reset your password`;

  await sendEmail({
    subject,
    to: [email],
    body: makeRequestPasswordResetEmail({
      email,
      resetPasswordEmailUiLink,
      serviceName,
      subject,
      user,
    }),
  });

  finish();

  function finish() {
    ctx.status = 200;
    ctx.body = {
      message: `An email has been sent to ${email} with a link to change your password.`,
    };
  }
}

requestPasswordChange.handler = function requestPasswordChangeHandler(options) {
  return async (ctx) => {
    const { email } = ctx.request.body || {};
    return requestPasswordChange(options, ctx, email);
  };
};

function makeDefaultRequestPasswordResetEmail({ subject, resetPasswordEmailUiLink, user }) {
  let userConfirmedPost = '';
  if (!user.confirmed) {
    userConfirmedPost = `<p>Note: this user is not confirmed! You can change your password, but
until you confirm your account, you won't be able to login.</p>`;
  }

  return `<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${subject}</title>
  </head>
  <body>
    <p>Someone has requested to change the password for your account.</p>
    <p>To change your password, <a href="${resetPasswordEmailUiLink}">click here</a> or copy
    & paste the following link into your browser:
    <br><br>
    <a href="${resetPasswordEmailUiLink}">${resetPasswordEmailUiLink}</a>
    </p>
    <p>If you do not want to change your password, you can ignore this email.</p>
    ${userConfirmedPost}
  </body>
</html>`;
}

export default requestPasswordChange;
