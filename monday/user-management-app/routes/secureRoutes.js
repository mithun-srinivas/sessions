// ROUTES - same endpoints, but login is required
//
// Compare this file with userRoutes.js. The controllers are the SAME.
// The only difference is the checkLoggedIn line below.

const express = require('express');
const controller = require('../controllers/userController');
const { checkLoggedIn } = require('../middlewares/auth');

const router = express.Router();

// this one line protects every route below it
router.use(checkLoggedIn);

router.post('/', controller.createUser);
router.get('/', controller.getAllUsers);
router.get('/:id', controller.getUser);
router.put('/:id', controller.updateUser);
router.delete('/:id', controller.deleteUser);

module.exports = router;
