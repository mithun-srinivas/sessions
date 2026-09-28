// MODEL - the only file that reads and writes user.json

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'user.json');

// read the whole file and give back the array
function readUsers() {
  const data = fs.readFileSync(FILE, 'utf-8');
  return JSON.parse(data);
}

// save the array back to the file
function saveUsers(users) {
  fs.writeFileSync(FILE, JSON.stringify(users, null, 2));
}

module.exports = { readUsers, saveUsers };
