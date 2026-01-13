const express = require('express');
const passport = require('passport');
const { getUserById } = require('../utils/dataStorage'); // Assuming this utility
const router = express.Router();

router.get('/auth/google', (req, res, next) => {
  const returnTo = req.query.returnTo || '/';

  const cookieOptions = {
    httpOnly: true,
    maxAge: 3600000, // 1 hour
    secure: true, // Explicitly true for your production setup
    domain: 'dungeonadmin.com', // Explicitly set for your production domain
    path: '/' // Good practice to be explicit
  };
  res.cookie('returnTo', returnTo, cookieOptions);

  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => { // Make async
    // req.user is populated by Passport.
    // Ensure your deserializeUser loads preferredEdition or fetch the full user data.
    // For this example, let's assume req.user might not be the full object from your DB yet,
    // or that preferredEdition might not be on it directly after passport.authenticate.
    const fullUser = await getUserById(req.user.id); // Fetch full user data
    
    if (fullUser && fullUser.preferredEdition) {
      req.session.edition = fullUser.preferredEdition;
    } else if (!req.session.edition) { // If no user preference and no session preference yet
      req.session.edition = 'Kizzet2024'; // Fallback default, or from a global config
    }
    const returnTo = req.cookies.returnTo || '/dashboard'; // Default to dashboard
    // Options for clearing MUST match how the cookie was set
    const clearCookieOptions = {
      httpOnly: true,
      secure: true,
      domain: 'dungeonadmin.com',
      path: '/'
    };
    res.clearCookie('returnTo', clearCookieOptions);
    res.redirect(returnTo);
  });

router.post('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.json({ success: true });
  });
});

router.get('/auth-status', (req, res) => {
  console.log('Auth Status Check: req.isAuthenticated() =', req.isAuthenticated()); // LOG 7
    console.log('Auth Status Check: req.user =', req.user); // LOG 8 <-- Pay close attention here
    console.log('Auth Status Check: req.session.edition =', req.session.edition); // LOG 9
    if (req.isAuthenticated()) {
        res.json({
            isAuthenticated: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                // Send the effective edition; req.user.preferredEdition might be stale if session changed it
                preferredEdition: req.user.preferredEdition || req.session.edition
            },
            currentEdition: req.session.edition // Explicitly send current session edition
        });
    } else {
        res.json({ isAuthenticated: false, currentEdition: req.session.edition });
    }
});

module.exports = router;