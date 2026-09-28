// MODEL - the only file that reads and writes user.json

const fs = require('fs');

// user.json sits right next to this file inside the models folder.
// __dirname is the path of THIS folder, so the file is found no matter
// which folder you run "npm start" from.
const FILE = __dirname + '/user.json';

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
