// MODEL - the only file that reads and writes posts.json

const fs = require('fs');

function readPosts() {
  const data = fs.readFileSync('./posts.json', 'utf-8');
  return JSON.parse(data);
}

function savePosts(posts) {
  fs.writeFileSync('./posts.json', JSON.stringify(posts, null, 2));
}

module.exports = { readPosts, savePosts };
