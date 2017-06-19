import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import fullAuthMiddleware from '..';
import mockUserStore from './mock-user-store';
import * as mockEmailService from './mock-email-service';

export default function startTestServer(options = {}) {
  mockEmailService.clear();
  mockUserStore.clear();

  const testOptions = Object.assign({
    serviceName: 'test service',
    confirmAccountLink: 'https://app.com/user/verify',
    sendEmail: mockEmailService.sendEmail,
    userStore: mockUserStore,
  }, options);

  const app = new Koa();
  app.use(bodyParser());
  app.use(fullAuthMiddleware(testOptions));
  return app.listen(3000);
}
