/**
 * src/routes/user.routes.js
 * ---------------------------------------------------------------------------
 * OPEN routes — plain CRUD, NO auth middleware.
 * Mounted at /api/users
 *
 * A route file is a table of contents: URL + method -> handler. There is no
 * `if`, no `fs`, and no business logic in here. If you ever feel like adding
 * logic to a route file, it belongs in a controller.
 *
 *   POST   /api/users      -> create
 *   GET    /api/users      -> read all
 *   GET    /api/users/:id  -> read one
 *   PUT    /api/users/:id  -> update
 *   DELETE /api/users/:id  -> delete
 */

const express = require('express');
const userController = require('../controllers/user.controller');
const {
  validateCreateUser,
  validateUpdateUser,
} = require('../middlewares/validate.middleware');

const router = express.Router();

router.post('/', validateCreateUser, userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', validateUpdateUser, userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
