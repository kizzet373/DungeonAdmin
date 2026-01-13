function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login'); // Or send a 401 Unauthorized status
  }
  
  module.exports = { isAuthenticated };