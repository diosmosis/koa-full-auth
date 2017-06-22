import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import jwt from 'koa-jwt';
import _ from 'koa-route';
import { createUser, login, requestPasswordChange, changePassword, confirmUser } from '..';
import mockUserStore from './mock-user-store';
import * as mockEmailService from './mock-email-service';

export default function startTestServer(options = {}, { requireJwt } = {}) {
  mockEmailService.clear();
  mockUserStore.clear();

  const testOptions = Object.assign({
    serviceName: 'test service',
    confirmAccountLink: 'https://app.com/user/verify',
    resetPasswordLink: 'https://app.com/user/password/reset',
    sendEmail: mockEmailService.sendEmail,
    userStore: mockUserStore,
    jwtSecret: 'testSecret',
  }, options);

  const app = new Koa();
  app.use(bodyParser());

  if (requireJwt) {
    app.use(
      jwt({ secret: 'testSecret' })
        .unless({ path: ['/login', '/users/password/reset'] }),
    );
  }

  app.use(_.post('/users', createUser.handler(testOptions)));
  app.use(_.post('/users/confirm', confirmUser.handler(testOptions)));
  app.use(_.post('/login', login.handler(testOptions)));
  app.use(_.post('/users/password', requestPasswordChange.handler(testOptions)));
  app.use(_.post('/users/password/reset', changePassword.handler(testOptions)));

  app.use(_.get('/afterauth', (ctx) => {
    ctx.body = {
      message: 'hello world',
    };
  }));
  return app.listen(3000);
}
