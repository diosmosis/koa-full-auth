import { expect } from 'chai';
import request from 'request-promise';
import * as passwords from '../src/passwords';
import * as emailToken from '../src/email-token';
import startServer from './server';
import mockUserStore from './mock-user-store';

const TEST_EMAIL = 'test@testytestersons.com';
const TEST_EMAIL2 = 'test2@testytestersons.com';
const TEST_SALT = 'testsalt';
const TEST_PWD = 'testpassword';

describe('change password', () => {
  let server;
  before(async () => {
    server = startServer();

    const passwordHash = await passwords.computeHash(TEST_PWD, TEST_SALT);
    mockUserStore.createUser(TEST_EMAIL, passwordHash, TEST_SALT, true);
    mockUserStore.createUser(TEST_EMAIL2, passwordHash, TEST_SALT, false);
  });
  after(() => server.close());

  it('should change the password of a confirmed user', async () => {
    const newPassword = 'newpass';
    const token = emailToken.generate('change-password', mockUserStore.getUser(TEST_EMAIL));

    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/password/reset',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: TEST_EMAIL,
        token,
        newPassword,
      },
    });

    expect(response.statusCode).to.equal(204);

    const newHash = await passwords.computeHash(newPassword, TEST_SALT);
    expect(mockUserStore.getUser(TEST_EMAIL).passwordHash).to.equal(newHash);
  });

  it('should change the password of an unconfirmed user', async () => {
    const newPassword = 'newpass2';

    const timeInPast = new Date();
    timeInPast.setMinutes(0, 0, 0);
    timeInPast.setHours(2);

    const token = emailToken.generateForTime('change-password', mockUserStore.getUser(TEST_EMAIL2),
      timeInPast);

    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/password/reset',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: TEST_EMAIL2,
        token,
        newPassword,
      },
    });

    expect(response.statusCode).to.equal(204);

    const newHash = await passwords.computeHash(newPassword, TEST_SALT);
    expect(mockUserStore.getUser(TEST_EMAIL2).passwordHash).to.equal(newHash);
  });

  it('should not change the password if the email does not exist', async () => {
    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/password/reset',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: 'whatever@whatever.com',
        token: 'garbagetoken',
        newPassword: 'sdlkfjsadlkf',
      },
      simple: false,
    });

    expect(response.statusCode).to.equal(400);
    expect(response.body.error).to.equal('Invalid or expired token.');
  });

  it('should not change the password if the token is incorrect', async () => {
    const newPassword = 'newpass';

    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/password/reset',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: TEST_EMAIL,
        token: 'sdklsadjfslakdjfalskjf',
        newPassword,
      },
      simple: false,
    });

    expect(response.statusCode).to.equal(400);
    expect(response.body.error).to.equal('Invalid or expired token.');
  });

  it('should not change the password if the token is expired', async () => {
    const newPassword = 'newpass2';

    const timeInPast = new Date();
    timeInPast.setMinutes(0, 0, 0);
    timeInPast.setDate(timeInPast.getDate() - 1);

    const token = emailToken.generateForTime('change-password', mockUserStore.getUser(TEST_EMAIL2),
      timeInPast);

    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/password/reset',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: TEST_EMAIL2,
        token,
        newPassword,
      },
      simple: false,
    });

    expect(response.statusCode).to.equal(400);
    expect(response.body.error).to.equal('Invalid or expired token.');
  });
});
