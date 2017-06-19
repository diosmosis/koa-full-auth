'use strict';

import * as crypto from 'crypto';

export function generate(email, hash, salt) {
  const currentTimeToHour = new Date();
  currentTimeToHour.setMinutes(0, 0, 0);

  const hmac = crypto.createHmac('sha256', salt);
  hmac.update(email + hash + currentTimeToHour.getTime());
  return hmac.digest('base64');
}

export function verify() {
  throw new Error('Not implemented.');
}
