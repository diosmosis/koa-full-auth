// TODO: use nodemailer for tests.
let mockEmails = [];

export function clear() {
  mockEmails = [];
}

export function sendEmail(email) {
  mockEmails.push(email);
}

export function getEmails() {
  return mockEmails;
}
