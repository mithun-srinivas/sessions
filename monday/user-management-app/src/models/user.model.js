/**
 * src/models/user.model.js
 * ---------------------------------------------------------------------------
 * THE MODEL LAYER.
 *
 * This file is the ONLY place in the whole application that knows where users
 * are actually stored. Today that is a JSON file on disk; tomorrow it could be
 * MongoDB or Postgres. When that day comes, this is the only file that changes.
 *
 * RULE: nothing in here may touch `req` or `res`. The model knows nothing about
 * HTTP. Every function below could be called from a CLI script or a unit test.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'user.json');

/* -------------------------------------------------------------------------
 * Private helpers — file I/O lives here and nowhere else.
 * ---------------------------------------------------------------------- */

function readUsersFromDisk() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // The file may not exist on a fresh checkout — treat that as "no users yet".
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function writeUsersToDisk(users) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2) + '\n', 'utf-8');
}

/**
 * Ids must stay unique even after deletions, so we never use `length + 1`.
 * With users [1, 2, 3], delete id 1: the array length is now 2, so `length + 1`
 * hands out id 3 — which already belongs to somebody. Taking `max(id) + 1`
 * can never collide with a user that still exists.
 */
function nextId(users) {
  return users.reduce((max, user) => Math.max(max, Number(user.id) || 0), 0) + 1;
}

/* -------------------------------------------------------------------------
 * Public API — this is what the controller is allowed to call.
 * ---------------------------------------------------------------------- */

function findAll() {
  return readUsersFromDisk();
}

function findById(id) {
  const users = readUsersFromDisk();
  return users.find((user) => String(user.id) === String(id)) || null;
}

function findByEmail(email) {
  if (!email) return null;
  const users = readUsersFromDisk();
  const needle = String(email).toLowerCase();
  return users.find((user) => String(user.email).toLowerCase() === needle) || null;
}

function create({ name, email, age }) {
  const users = readUsersFromDisk();
  const now = new Date().toISOString();

  const user = {
    id: nextId(users),
    name,
    email,
    age: age === undefined ? null : age,
    createdAt: now,
    updatedAt: now,
  };

  users.push(user);
  writeUsersToDisk(users);
  return user;
}

/**
 * Merges the supplied fields into the existing user.
 * Returns the updated user, or null if there is no user with that id.
 */
function update(id, changes) {
  const users = readUsersFromDisk();
  const index = users.findIndex((user) => String(user.id) === String(id));
  if (index === -1) return null;

  const existing = users[index];
  const updated = {
    ...existing,
    ...changes,
    id: existing.id,                 // the id is never client-writable
    createdAt: existing.createdAt,   // nor is the creation timestamp
    updatedAt: new Date().toISOString(),
  };

  users[index] = updated;
  writeUsersToDisk(users);
  return updated;
}

/**
 * Returns the deleted user, or null if there was nothing to delete.
 */
function remove(id) {
  const users = readUsersFromDisk();
  const index = users.findIndex((user) => String(user.id) === String(id));
  if (index === -1) return null;

  const [deleted] = users.splice(index, 1);
  writeUsersToDisk(users);
  return deleted;
}

function count() {
  return readUsersFromDisk().length;
}

module.exports = {
  findAll,
  findById,
  findByEmail,
  create,
  update,
  remove,
  count,
};
