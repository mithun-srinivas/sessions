// ROUTES - open, no login needed

const express = require('express');
const controller = require('../controllers/userController');

const router = express.Router();

router.get('/health', (req, res) => {res.send('App is up & running')});
router.post('/', controller.createUser);
router.get('/', controller.getAllUsers);
router.get('/:id', controller.getUser);
router.put('/:id', controller.updateUser);
router.delete('/:id', controller.deleteUser);

module.exports = router;
