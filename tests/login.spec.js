import { expect } from 'chai';
import request from 'request-promise';
import jwt from 'jsonwebtoken';
import { startServer, TEST_JWT_SECRET } from './server';
import mockUserStore from './mock-user-store';
import * as passwords from '../src/passwords';

const TEST_EMAIL = 'test@testytestersons.com';
const TEST_EMAIL2 = 'test2@testytestersons.com';
const TEST_SALT = 'testsalt';
const TEST_PWD = 'testpassword';

describe('login', () => {
  let server;
  let passwordHash;
  before(async () => {
    server = startServer({}, {
      requireJwt: true,
    });

    passwordHash = await passwords.computeHash(TEST_PWD, TEST_SALT);
    mockUserStore.createUser(TEST_EMAIL, passwordHash, TEST_SALT, true);
    mockUserStore.createUser(TEST_EMAIL2, passwordHash, TEST_SALT, false);
  });
  after(() => server.close());

  it('should fail when the password are incorrect', async () => {
    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/login',
      json: true,
      resolveWithFullResponse: true,
      simple: false,
      body: {
        username: TEST_EMAIL,
        password: 'wrongpass',
      },
    });

    expect(response.statusCode).to.equal(401);
    expect(response.body.error).to.equal('Invalid email or password.');
  });

  it('should fail when the email is incorrect', async () => {
    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/login',
      json: true,
      resolveWithFullResponse: true,
      simple: false,
      body: {
        username: 'wrongemail',
        password: TEST_PWD,
      },
    });

    expect(response.statusCode).to.equal(401);
    expect(response.body.error).to.equal('Invalid email or password.');
  });

  it('should fail if the email is not verified', async () => {
    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/login',
      json: true,
      resolveWithFullResponse: true,
      simple: false,
      body: {
        username: TEST_EMAIL2,
        password: TEST_PWD,
      },
    });

    expect(response.statusCode).to.equal(401);
    expect(response.body.error).to.equal('Invalid email or password.');
  });

  it('should generate jwt when email/password are correct', async () => {
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
    expect(response.body.token).to.be.ok;

    // check token expires at the correct time (test the jwtSigningOptions are used)
    const decoded = jwt.verify(response.body.token, TEST_JWT_SECRET + passwordHash);
    expect(decoded.exp).to.be.ok;
    expect(decoded.exp - decoded.iat).to.equal(86400);

    const testJwtResponse = await request({
      method: 'GET',
      uri: 'http://localhost:3000/afterauth',
      json: true,
      resolveWithFullResponse: true,
      headers: {
        Authorization: `Bearer ${response.body.token}`,
      },
    });

    expect(testJwtResponse.body).to.deep.equal({
      message: 'hello world',
    });
  });
});
