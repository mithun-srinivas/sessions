// ROUTES - which URL runs which controller function

const express = require('express');
const controller = require('../controllers/postController');

const router = express.Router();

router.get('/', controller.showAllPosts);          // home page
router.get('/new', controller.showNewForm);        // the form
router.post('/new', controller.createPost);        // the form submits here
router.get('/post/:id', controller.showOnePost);   // one post
router.post('/post/:id/delete', controller.deletePost);

module.exports = router;
