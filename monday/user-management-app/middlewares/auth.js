// MIDDLEWARE - checks if the user is logged in

let isLoggedIn = false;

// this runs BEFORE the controller.
// if it calls next() the request continues.
// if it sends a response the controller never runs.
function checkLoggedIn(req, res, next) {
  if (!isLoggedIn) {
    return res.status(401).json({ message: 'Please login first' });
  }
  next();
}

function login() {
  isLoggedIn = true;
}

function logout() {
  isLoggedIn = false;
}

function getStatus() {
  return isLoggedIn;
}

module.exports = { checkLoggedIn, login, logout, getStatus };
