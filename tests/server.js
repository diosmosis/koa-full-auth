import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import jwt from 'koa-jwt';
import _ from 'koa-route';
import { createUser, login } from '..';
import mockUserStore from './mock-user-store';
import * as mockEmailService from './mock-email-service';

export default function startTestServer(options = {}, { requireJwt } = {}) {
  mockEmailService.clear();
  mockUserStore.clear();

  const testOptions = Object.assign({
    serviceName: 'test service',
    confirmAccountLink: 'https://app.com/user/verify',
    sendEmail: mockEmailService.sendEmail,
    userStore: mockUserStore,
    jwtSecret: 'testSecret',
  }, options);

  const app = new Koa();
  app.use(bodyParser());

  if (requireJwt) {
    app.use(jwt({ secret: 'testSecret' }).unless({ path: '/login' }));
  }

  app.use(_.post('/users', createUser(testOptions)));
  app.use(_.post('/login', login(testOptions)));

  app.use(_.get('/afterauth', (ctx) => {
    ctx.body = {
      message: 'hello world',
    };
  }));
  return app.listen(3000);
}
