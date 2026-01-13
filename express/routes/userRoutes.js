const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { saveUserPreferences, getUserById } = require('../utils/dataStorage');

const editions = ['Kizzet2024', '2024', '5e'];

router.get('/user', isAuthenticated, (req, res) => {
  // req.user is populated by Passport's deserializeUser
  // Send a subset of user data to avoid exposing sensitive info if any
  const { id, email, name, characters, preferredEdition } = req.user;
  res.json({
    id, email, name,
    characters: characters || [],
    preferredEdition: preferredEdition || req.session.edition // Fallback to session's current edition
  });
});

router.post('/set-edition', async (req, res) => {
    const { edition: selectedEdition } = req.body;

    if (!selectedEdition || !editions.includes(selectedEdition)) {
        return res.status(400).json({ error: 'Invalid edition specified.' });
    }

    // Always set the edition in the session cookie automatically managed by express-session
    req.session.edition = selectedEdition;

    if (req.user && req.user.id) {
        try {
            req.user.preferredEdition = selectedEdition; 
            await saveUserPreferences(req.user.id, { preferredEdition: selectedEdition });
            console.log(`User ${req.user.id} preferred edition set to ${selectedEdition} and saved to file.`);
        } catch (error) {
            console.error(`Error saving preferred edition for user ${req.user.id}:`, error);
        }
    } else {
        console.log(`Anonymous session edition set to ${selectedEdition}.`);
    }

    res.json({ success: true, edition: req.session.edition });
});

module.exports = router;