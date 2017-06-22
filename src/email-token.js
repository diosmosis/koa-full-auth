'use strict';

import * as crypto from 'crypto';

const HOURS_IN_DAY = 24;

export function generate(operation, user) {
  const currentTimeToHour = new Date();
  currentTimeToHour.setMinutes(0, 0, 0);

  return generateForTime(operation, user, currentTimeToHour);
}

export function isValidToken(token, operation, user) {
  const timeToCheck = new Date();
  timeToCheck.setMinutes(0, 0, 0);

  for (let hour = 0; hour !== HOURS_IN_DAY; hour += 1) {
    timeToCheck.setHours(hour);

    const possibleToken = generateForTime(operation, user, timeToCheck);
    if (token === possibleToken) {
      return true;
    }
  }

  return false;
}

export function generateForTime(operation, user, currentTimeToHour) {
  const hmac = crypto.createHmac('sha256', user.salt);
  hmac.update(operation + user.email + user.passwordHash + currentTimeToHour.getTime());
  return hmac.digest('base64');
}
