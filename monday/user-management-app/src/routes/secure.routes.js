/**
 * src/routes/secure.routes.js
 * ---------------------------------------------------------------------------
 * PROTECTED routes — the same CRUD, guarded by the isLoggedIn middleware.
 * Mounted at /api/secure/users
 *
 * THE POINT OF THIS FILE: compare it with user.routes.js. The controller
 * functions are identical — `userController.createUser` is literally the same
 * function object in both files. The only difference is the single
 * `router.use(checkLoggedIn)` line below.
 *
 * That is separation of concerns in one screen: the controller has no idea
 * authentication exists, and the middleware has no idea what a user record
 * looks like.
 */

const express = require('express');
const userController = require('../controllers/user.controller');
const { checkLoggedIn } = require('../middlewares/auth.middleware');
const {
  validateCreateUser,
  validateUpdateUser,
} = require('../middlewares/validate.middleware');

const router = express.Router();

// Router-level middleware: one line protects every route declared below it.
// Better than repeating `checkLoggedIn` on each route, because you cannot
// forget it on the sixth endpoint you add next month.
router.use(checkLoggedIn);

router.post('/', validateCreateUser, userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', validateUpdateUser, userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
