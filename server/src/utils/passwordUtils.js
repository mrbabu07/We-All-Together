const bcrypt = require('bcryptjs')

const SALT_ROUNDS = 12

const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS)

const comparePassword = async (candidatePassword, hashedPassword) =>
  bcrypt.compare(candidatePassword, hashedPassword)

module.exports = {
  hashPassword,
  comparePassword,
}
