/**
 * src/controllers/user.controller.js
 * ---------------------------------------------------------------------------
 * THE CONTROLLER LAYER.
 *
 * A controller does exactly three things:
 *   1. pull what it needs out of `req` (params / body / query),
 *   2. ask the MODEL to do the actual work,
 *   3. send a response with the right status code.
 *
 * Notice there is not a single `fs` call in this file, and no knowledge of
 * whether a user is logged in. Storage is the model's job; authentication is
 * the middleware's job. That is why these very same five functions serve both
 * the open routes and the protected routes.
 */

const userModel = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /users — create a user.
 * 201 on success, 400 on bad input, 409 if the email is taken.
 */
function createUser(req, res, next) {
  try {
    const { name, email, age } = req.body;

    if (userModel.findByEmail(email)) {
      return sendError(res, 409, `A user with the email "${email}" already exists.`);
    }

    const user = userModel.create({ name, email, age });
    return sendSuccess(res, 201, 'User created successfully.', user);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users — list every user.
 * Always 200, even when the list is empty: "no users" is a valid answer,
 * not an error.
 */
function getAllUsers(req, res, next) {
  try {
    const users = userModel.findAll();
    return sendSuccess(res, 200, `Fetched ${users.length} user(s).`, users);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/:id — read one user.
 * 404 when that id does not exist.
 */
function getUserById(req, res, next) {
  try {
    const user = userModel.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, `No user found with id ${req.params.id}.`);
    }
    return sendSuccess(res, 200, 'User fetched successfully.', user);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /users/:id — update a user.
 * Only name / email / age are accepted; anything else the client sends is
 * ignored. Never trust the body to decide which fields are writable.
 */
function updateUser(req, res, next) {
  try {
    const { id } = req.params;

    if (!userModel.findById(id)) {
      return sendError(res, 404, `No user found with id ${id}.`);
    }

    const { name, email, age } = req.body;

    // Reject an email that already belongs to somebody else.
    if (email) {
      const owner = userModel.findByEmail(email);
      if (owner && String(owner.id) !== String(id)) {
        return sendError(res, 409, `The email "${email}" is already in use.`);
      }
    }

    const changes = {};
    if (name !== undefined) changes.name = name;
    if (email !== undefined) changes.email = email;
    if (age !== undefined) changes.age = age;

    if (Object.keys(changes).length === 0) {
      return sendError(res, 400, 'Nothing to update. Send at least one of: name, email, age.');
    }

    const user = userModel.update(id, changes);
    return sendSuccess(res, 200, 'User updated successfully.', user);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /users/:id — remove a user.
 * We return 200 with the deleted record rather than 204, so the class can see
 * what was removed. 204 (No Content) would be equally correct REST.
 */
function deleteUser(req, res, next) {
  try {
    const deleted = userModel.remove(req.params.id);
    if (!deleted) {
      return sendError(res, 404, `No user found with id ${req.params.id}.`);
    }
    return sendSuccess(res, 200, 'User deleted successfully.', deleted);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
