import { expect } from 'chai';
import request from 'request-promise';
import jwt from 'jsonwebtoken';
import { startServer, TEST_JWT_SECRET } from './server';
import mockUserStore from './mock-user-store';
import * as passwords from '../src/passwords';

const TEST_EMAIL = 'test@testytestersons.com';
const TEST_SALT = 'testsalt';
const TEST_PWD = 'testpassword';

describe('reSign', () => {
  let server;
  let passwordHash;
  let token;
  before(async () => {
    server = startServer({}, {
      requireJwt: true,
    });

    passwordHash = await passwords.computeHash(TEST_PWD, TEST_SALT);
    mockUserStore.createUser(TEST_EMAIL, passwordHash, TEST_SALT, true);

    // login to get a usable token
    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/login',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: TEST_EMAIL,
        password: TEST_PWD,
      },
    });

    expect(response.statusCode).to.equal(200);
    token = response.body.token;
  });
  after(() => server.close());

  it('should not re-sign requests that fail to authenticate', async () => {
    const response = await request({
      method: 'GET',
      uri: 'http://localhost:3000/afterauth',
      json: true,
      resolveWithFullResponse: true,
      simple: false,
      body: {},
    });

    expect(response.headers.authorization).to.be.not.ok;
    expect(response.statusCode).to.equal(401);
  });

  it('should re-sign requests that authenticate successfully', async () => {
    // wait a bit so our new JWT's iat will change
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await request({
      method: 'GET',
      uri: 'http://localhost:3000/afterauth',
      json: true,
      resolveWithFullResponse: true,
      simple: false,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).to.equal(200);
    expect(response.headers.authorization).to.be.ok;

    const newToken = response.headers.authorization.substring('Bearer '.length);

    const tokenDecoded = jwt.verify(token, TEST_JWT_SECRET + passwordHash);
    const newTokenDecoded = jwt.verify(newToken, TEST_JWT_SECRET + passwordHash);

    expect(newTokenDecoded.iat).to.be.ok;
    expect(newTokenDecoded.iat).to.be.above(tokenDecoded.iat);
  });

  it('should not re-sign requests that do not require authentication', async () => {
    const response = await request({
      method: 'GET',
      uri: 'http://localhost:3000/noauthrequired',
      json: true,
      resolveWithFullResponse: true,
      simple: false,
      body: {},
    });

    expect(response.headers.authorization).to.be.not.ok;
    expect(response.statusCode).to.equal(200);
  });
});
