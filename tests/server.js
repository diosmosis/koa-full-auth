import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import jwt from 'koa-jwt';
import _ from 'koa-route';
import { createUser, login, requestPasswordChange, changePassword, confirmUser,
  reSign, setSecret } from '..';
import mockUserStore from './mock-user-store';
import * as mockEmailService from './mock-email-service';

const TEST_JWT_SECRET = 'testSecret';

export { TEST_JWT_SECRET };

export function startServer(options = {}, { requireJwt } = {}) {
  mockEmailService.clear();
  mockUserStore.clear();

  const testOptions = Object.assign({
    serviceName: 'test service',
    confirmAccountLink: 'https://app.com/user/verify',
    resetPasswordLink: 'https://app.com/user/password/reset',
    sendEmail: mockEmailService.sendEmail,
    userStore: mockUserStore,
    jwtSecret: TEST_JWT_SECRET,
    jwtSigningOptions: {
      expiresIn: '1d',
    },
  }, options);

  const app = new Koa();
  app.use(bodyParser());

  if (requireJwt) {
    app.use(setSecret.middleware(testOptions));

    app.use(
      jwt().unless({ path: ['/login', '/users/password/reset', '/noauthrequired'] }),
    );

    app.use(reSign.middleware(testOptions));
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
  app.use(_.get('/noauthrequired', (ctx) => {
    ctx.body = {
      message: 'finished!',
    };
  }));
  return app.listen(3000);
}
