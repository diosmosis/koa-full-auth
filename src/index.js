'use strict';

import * as handlers from './handlers';

const REQUIRED_OPTIONS = [
  'serviceName',
  'confirmAccountLink',
  'sendEmail',
];

/**
 * TODO
 * TODO: note that it requires body parsing middleware
 *
 * @param {string} options.serviceName (Required) The name of the service. This name is used in emails.
 * @param {string} options.confirmAccountLink (Required) The link to your frontend that confirm's a user's new account.
 *     The link should not have query parameters. Two query params will be added:
 *     - "email": The email of the new user account.
 *     - "token": The confirmation token.
 * @param {Function} options.sendEmail (Required) An async function that sends an email. An object with
 *     the following properties is passed to this function:
 *     - "subject": the email's subject
 *     - "to": an array of email recipients
 *     - "body": the HTML email body
 * @param {Object} options.userStore (Required) The user store object used to save/fetch users.
 * @param {Function} options.userStore.saveUser (Required) Accepts an email, hash and salt.
 * @param {Function} options.userStore.getUser (Required) Gets user info by email.
 * @param {Function} options.makeConfirmationEmail A function that generates HTML for the confirm new user email.
 * @param {number} options.saltLength The size in bytes of the salt.
 * @param {Object} options.paths Custom paths for each route.
 */
export default function fullAuthMiddlewareFactory(options = {}) {
  REQUIRED_OPTIONS.forEach((optionName) => {
    if (!options[optionName]) {
      throw new Error(`The option "${optionName} is required for the full auth koa middleware."`);
    }
  });

  const routes = makeRoutes(options.paths || {});

  return fullAuthMiddleware.bind(null, { options, routes });
}

async function fullAuthMiddleware({ options, routes }, ctx, next) {
  if (routes[ctx.method] && routes[ctx.method][ctx.path]) {
    const handler = routes[ctx.method][ctx.path];
    await handler(ctx, options);
    return;
  }

  await next();
}

function makeRoutes({
  createUser = ['POST', '/users'],
  login = ['POST', '/login'],
} = {}) {
  const specs = [
    createUser,
    login,
  ];

  const handlersList = [
    handlers.createUser,
    handlers.login,
  ];

  const routes = {};
  specs.forEach(([method, path], index) => {
    if (!routes[method]) {
      routes[method] = {};
    }

    routes[method][path] = handlersList[index];
  });
  return routes;
}
