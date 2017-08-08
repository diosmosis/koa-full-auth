import { expect } from 'chai';
import request from 'request-promise';
import { startServer } from './server';
import mockUserStore from './mock-user-store';
import * as mockEmailService from './mock-email-service';

describe('create user', () => {
  let server;
  before(() => {
    server = startServer();
  });
  after(() => {
    if (server) {
      server.close();
    }
  });

  it('should create a user in the memory store & send a verification email', async () => {
    const response = await request({
      method: 'POST',
      uri: 'http://localhost:3000/users',
      json: true,
      resolveWithFullResponse: true,
      body: {
        email: 'testperson@testytestersons.com',
        password: 'iamsosecure',
      },
    });

    expect(response.body).to.not.be.ok;
    expect(response.statusCode).to.equal(204);

    const users = mockUserStore.getUsers();
    expect(users.length).to.equal(1);
    expect(users[0].email).to.equal('testperson@testytestersons.com');
    expect(users[0].passwordHash).to.match(/[a-fA-F0-9]+/);
    expect(users[0].salt).to.match(/[a-fA-F0-9]+/);
    expect(users[0].confirmed).to.equal(false);

    const emails = mockEmailService.getEmails();
    expect(emails.length).to.equal(1);
    expect(emails[0].subject).to.equal('test service - Confirm your account');
    expect(emails[0].to).to.deep.equal(['testperson@testytestersons.com']);

    const baseUrl = 'https://app.com/user/verify?email=testperson%40testytestersons.com&token=';
    const regexStr = `${escapeRegExp(baseUrl)}[a-zA-Z0-9%]+`;

    expect(emails[0].body).to.contain('click here to confirm your account with test service');
    expect(emails[0].body).to.match(new RegExp(regexStr, 'g'));
  });
});

function escapeRegExp(string) {
  return string.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
}
