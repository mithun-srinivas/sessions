// CONTROLLER - gets the data, then renders a Pug view
//
// On Monday these functions ended with res.json(...).
// Today they end with res.render(...). That is the only real change.

const { readPosts, savePosts } = require('../models/postModel');

// HOME - all posts
function showAllPosts(req, res) {
  const posts = readPosts();

  // render views/index.pug and give it this data
  res.render('index', { title: 'My Blog', posts: posts });
}

// ONE POST
function showOnePost(req, res) {
  const posts = readPosts();
  const post = posts.find((p) => p.id == req.params.id);

  if (!post) {
    return res.status(404).send('Post not found');
  }

  res.render('post', { title: post.title, post: post });
}

// THE FORM
function showNewForm(req, res) {
  res.render('new', { title: 'New post' });
}

// CREATE - the form sends us here
function createPost(req, res) {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).send('Please fill in both fields');
  }

  const posts = readPosts();

  let newId = 1;
  if (posts.length > 0) {
    newId = posts[posts.length - 1].id + 1;
  }

  posts.push({ id: newId, title: title, body: body });
  savePosts(posts);

  // redirect so that refreshing does not post it twice
  res.redirect('/');
}

// DELETE
function deletePost(req, res) {
  const posts = readPosts();

  // keep everything except the one we are deleting
  const remaining = posts.filter((p) => p.id != req.params.id);

  savePosts(remaining);
  res.redirect('/');
}

module.exports = {
  showAllPosts,
  showOnePost,
  showNewForm,
  createPost,
  deletePost,
};
