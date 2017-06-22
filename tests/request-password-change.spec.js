import { expect } from 'chai';
import request from 'request-promise';
import * as passwords from '../src/passwords';
import startServer from './server';
import mockUserStore from './mock-user-store';
import * as mockEmailService from './mock-email-service';

const TEST_EMAIL = 'test@testytestersons.com';
const TEST_EMAIL2 = 'test2@testytestersons.com';
const TEST_SALT = 'testsalt';
const TEST_PWD = 'testpassword';

describe('request password change', () => {
  let server;
  before(async () => {
    server = startServer();

    const passwordHash = await passwords.computeHash(TEST_PWD, TEST_SALT);
    mockUserStore.createUser(TEST_EMAIL, passwordHash, TEST_SALT, true);
    mockUserStore.createUser(TEST_EMAIL2, passwordHash, TEST_SALT, false);
  });
  after(() => {
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    mockEmailService.clear();
  });

  it('should not send an email to the user if the email does not exist', async () => {
    const unknownEmail = 'whatever@wherever.com';

    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/password',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: unknownEmail,
      },
    });

    expect(response.statusCode).to.equal(200);
    expect(response.body.message).to.equal(
      `An email has been sent to ${unknownEmail} with a link to change your password.`);

    expect(mockEmailService.getEmails()).to.be.empty;
  });

  it('should send an email to the user if the email exists', async () => {
    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/password',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: TEST_EMAIL,
      },
    });

    expect(response.statusCode).to.equal(200);
    expect(response.body.message).to.equal(
      `An email has been sent to ${TEST_EMAIL} with a link to change your password.`);

    const emails = mockEmailService.getEmails();
    expect(emails).to.have.length(1);

    checkResetEmail(emails[0], TEST_EMAIL);

    expect(emails[0].body).to.not.contain('Note: this user is not confirmed!');
  });

  it('should send an email to the user w/ an extra section if the email is for an unconfirmed user', async () => {
    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users/password',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: TEST_EMAIL2,
      },
    });

    expect(response.statusCode).to.equal(200);
    expect(response.body.message).to.equal(
      `An email has been sent to ${TEST_EMAIL2} with a link to change your password.`);

    const emails = mockEmailService.getEmails();
    expect(emails).to.have.length(1);

    checkResetEmail(emails[0], TEST_EMAIL2);

    expect(emails[0].body).to.contain('Note: this user is not confirmed!');
  });
});

function checkResetEmail(email, toAddress) {
  expect(email.subject).to.equal('test service - Reset your password');
  expect(email.to).to.deep.equal([toAddress]);

  const baseUrl = `https://app.com/user/password/reset?email=${encodeURIComponent(toAddress)}&token=`;
  const regexStr = `${escapeRegExp(baseUrl)}[a-zA-Z0-9%]+`;

  expect(email.body).to.contain('Someone has requested to change the password for your account.');
  expect(email.body).to.match(new RegExp(regexStr, 'g'));
}

function escapeRegExp(string) {
  return string.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
}
