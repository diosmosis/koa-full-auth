import { expect } from 'chai';
import request from 'request-promise';
import * as passwords from '../src/passwords';
import * as emailToken from '../src/email-token';
import { startServer } from './server';
import mockUserStore from './mock-user-store';

const TEST_EMAIL = 'test@testytestersons.com';
const TEST_EMAIL2 = 'test2@testytestersons.com';
const TEST_SALT = 'testsalt';
const TEST_PWD = 'testpassword';

describe('confirm new user', () => {
  let server;
  before(() => {
    server = startServer();
  });
  after(() => server.close());

  beforeEach(async () => {
    mockUserStore.clear();

    const passwordHash = await passwords.computeHash(TEST_PWD, TEST_SALT);
    mockUserStore.createUser(TEST_EMAIL, passwordHash, TEST_SALT, true);
    mockUserStore.createUser(TEST_EMAIL2, passwordHash, TEST_SALT, false);
  });

  it('should confirm an unconfirmed user', async () => {
    expect(mockUserStore.getUser(TEST_EMAIL2).confirmed).to.be.false;

    const token = emailToken.generate('create-user', mockUserStore.getUser(TEST_EMAIL2));

    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/confirm',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: TEST_EMAIL2,
        token,
      },
    });

    expect(response.statusCode).to.equal(204);
    expect(mockUserStore.getUser(TEST_EMAIL2).confirmed).to.be.true;
  });

  it('should have no effect on a confirmed user', async () => {
    expect(mockUserStore.getUser(TEST_EMAIL).confirmed).to.be.true;

    const token = emailToken.generate('create-user', mockUserStore.getUser(TEST_EMAIL));

    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/confirm',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: TEST_EMAIL,
        token,
      },
    });

    expect(response.statusCode).to.equal(204);
    expect(mockUserStore.getUser(TEST_EMAIL).confirmed).to.be.true;
  });

  it('should not confirm the user if the email does not exist', async () => {
    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/confirm',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: 'whatever@whatever.com',
        token: 'slkajdfsdlkf',
      },
      simple: false,
    });

    expect(response.statusCode).to.equal(400);
    expect(response.body.error).to.equal('Invalid or expired token.');
  });

  it('should not confirm the user if the token is incorrect', async () => {
    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/confirm',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: TEST_EMAIL2,
        token: 'slkdfjasdlfj',
      },
      simple: false,
    });

    expect(response.statusCode).to.equal(400);
    expect(response.body.error).to.equal('Invalid or expired token.');
  });

  it('should not confirm the user if the token is expired', async () => {
    expect(mockUserStore.getUser(TEST_EMAIL2).confirmed).to.be.false;

    const timeInPast = new Date();
    timeInPast.setMinutes(0, 0, 0);
    timeInPast.setDate(timeInPast.getDate() - 1);

    const token = emailToken.generateForTime('create-user', mockUserStore.getUser(TEST_EMAIL2),
      timeInPast);

    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/confirm',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: TEST_EMAIL2,
        token,
      },
      simple: false,
    });

    expect(response.statusCode).to.equal(400);
    expect(response.body.error).to.equal('Invalid or expired token.');
  });
});
