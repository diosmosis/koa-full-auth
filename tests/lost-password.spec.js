import { expect } from 'chai';
import startServer from './server';

describe('lost password', () => {
  let server;
  before(() => {
    server = startServer();
  });
  after(() => server.close());

  it('should have real tests', () => {
    expect(true).to.be.false;
  });
});
