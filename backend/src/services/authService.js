const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const userRepo = require('../repositories/userRepo');

async function signup({ username, email, password }) {
  const existingEmail = await userRepo.findByEmail(email);
  if (existingEmail) throw new Error('Email already in use.');

  const existingUsername = await userRepo.findByUsername(username);
  if (existingUsername) throw new Error('Username already taken.');

  const password_hash = await bcrypt.hash(password, 10);
  const user = await userRepo.create({ username, email, password_hash });

  const token = generateToken(user);
  return { user, token };
}

async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error('Invalid email or password.');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Invalid email or password.');

  const token = generateToken(user);
  return { user: { id: user.id, username: user.username, email: user.email }, token };
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { signup, login };
