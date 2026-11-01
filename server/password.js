import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function passwordHash(password, salt = randomBytes(24).toString('hex')) {
  return { salt, value: scryptSync(password, salt, 64).toString('hex') }
}

export function checkPassword(password, salt, expected) {
  const actual = Buffer.from(passwordHash(password, salt).value, 'hex')
  const saved = Buffer.from(expected, 'hex')
  return actual.length === saved.length && timingSafeEqual(actual, saved)
}
