// CONTROLLER - gets the data from the model and renders a Pug view
//
// On Monday our controllers ended with res.json(...).
// Today they end with res.render(...) instead - same job, different View.

const { readPosts, savePosts } = require('../models/postModel');

// HOME - show all posts
function showAllPosts(req, res) {
  const posts = readPosts();

  // res.render(viewName, dataForTheView)
  // looks for views/index.pug and hands it { title, posts }
  res.render('index', {
    title: 'My Blog',
    posts: posts,
  });
}

// SHOW ONE POST
function showOnePost(req, res) {
  const posts = readPosts();
  const post = posts.find((p) => p.id == req.params.id);

  if (!post) {
    return res.status(404).render('404', { title: 'Not found' });
  }

  res.render('post', {
    title: post.title,
    post: post,
  });
}

// SHOW THE "WRITE A POST" FORM
function showNewForm(req, res) {
  res.render('new', { title: 'New post' });
}

// CREATE A POST (the form sends us here)
function createPost(req, res) {
  const { title, body } = req.body;

  // if something is missing, show the form again with a message
  if (!title || !body) {
    return res.render('new', {
      title: 'New post',
      error: 'Please fill in both the title and the body.',
    });
  }

  const posts = readPosts();

  let newId = 1;
  if (posts.length > 0) {
    newId = posts[posts.length - 1].id + 1;
  }

  posts.push({
    id: newId,
    title: title,
    body: body,
    date: new Date().toDateString(),
  });

  savePosts(posts);

  // redirect after a form post, so refreshing the page
  // does not create the same post twice
  res.redirect('/');
}

// DELETE A POST
function deletePost(req, res) {
  const posts = readPosts();
  const index = posts.findIndex((p) => p.id == req.params.id);

  if (index !== -1) {
    posts.splice(index, 1);
    savePosts(posts);
  }

  res.redirect('/');
}

module.exports = {
  showAllPosts,
  showOnePost,
  showNewForm,
  createPost,
  deletePost,
};
