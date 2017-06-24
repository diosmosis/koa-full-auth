import * as crypto from 'crypto';
import promisify from 'es6-promisify';

const PBKDF2_ITERATIONS = 4096;
const PBKDF2_DIGEST = 'sha512';
const HASH_LENGTH = 8;

const randomBytes = promisify(crypto.randomBytes);
const pbkdf2 = promisify(crypto.pbkdf2);

export async function createSaltAndHash(saltLength, password) {
  const salt = await randomBytes(saltLength);
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS, HASH_LENGTH, PBKDF2_DIGEST);

  return {
    salt: salt.toString('hex'),
    hash: hash.toString('hex'),
  };
}

export async function computeHash(password, salt) {
  const hash = await pbkdf2(password, Buffer.from(salt, 'hex'), PBKDF2_ITERATIONS, HASH_LENGTH, PBKDF2_DIGEST);
  return hash.toString('hex');
}
