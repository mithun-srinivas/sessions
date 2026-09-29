// MODEL - the only file that reads and writes user.json

const fs = require('fs');

// read the whole file and give back the array
function readUsers() {
  const data = fs.readFileSync('./user.json', 'utf-8');
  return JSON.parse(data);
}

// save the array back to the file
function saveUsers(users) {
  fs.writeFileSync('./user.json', JSON.stringify(users, null, 2));
}

module.exports = { readUsers, saveUsers };
