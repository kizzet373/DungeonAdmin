const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 3000;

// Configure session middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: '8e9457a2b01f31fb818188366d503cade8e246c02e33d3176fbde06b96df25a3',
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Set up Google OAuth
passport.use(new GoogleStrategy({
    clientID: '828241244572-v5cet1m9akatlg0mamq34occm2bb4jqo.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'https://dungeonadmin.com/auth/google/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    // Find or create user
    return getUserById(profile.id)
      .then(user => {
        if (user) return done(null, user);
        
        return createUser({
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName
        }).then(newUser => done(null, newUser));
      })
      .catch(err => done(err));
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  getUserById(id)
    .then(user => done(null, user))
    .catch(err => done(err));
});

// Data storage functions
async function getUserById(id) {
  try {
    const userDataPath = path.join(__dirname, 'data', 'users', `${id}.json`);
    const userData = await fs.readFile(userDataPath, 'utf8');
    return JSON.parse(userData);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function createUser(userData) {
  const userDir = path.join(__dirname, 'data', 'users');
  try {
    await fs.mkdir(userDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
  
  const userDataPath = path.join(userDir, `${userData.id}.json`);
  await fs.writeFile(userDataPath, JSON.stringify(userData));
  return userData;
}

async function saveCharacterSheet(userId, characterData) {
  const characterId = characterData.id || crypto.randomUUID();
  const characterSheetDir = path.join(__dirname, 'data', 'characters');
  
  try {
    await fs.mkdir(characterSheetDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
  
  const characterPath = path.join(characterSheetDir, `${characterId}.json`);
  
  // Add metadata to character
  characterData.id = characterId;
  characterData.owner = userId;
  characterData.created = new Date().toISOString();
  characterData.updated = new Date().toISOString();
  
  // Save character data
  await fs.writeFile(characterPath, JSON.stringify(characterData));
  
  // Update user's character list
  const user = await getUserById(userId);
  if (!user.characters) user.characters = [];
  if (!user.characters.includes(characterId)) {
    user.characters.push(characterId);
    const userPath = path.join(__dirname, 'data', 'users', `${userId}.json`);
    await fs.writeFile(userPath, JSON.stringify(user));
  }
  
  return characterId;
}

async function getCharacterSheet(characterId) {
  const characterPath = path.join(__dirname, 'data', 'characters', `${characterId}.json`);
  try {
    const characterData = await fs.readFile(characterPath, 'utf8');
    return JSON.parse(characterData);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

// Auth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  });

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Serve static files from 'public' directory
app.use(express.static('public'));

// Dashboard route
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Character sheet routes
app.post('/api/characters', isAuthenticated, async (req, res) => {
  try {
    const characterId = await saveCharacterSheet(req.user.id, req.body);
    res.status(201).json({ id: characterId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save character sheet' });
  }
});

app.get('/api/characters', isAuthenticated, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    const characterPromises = (user.characters || []).map(id => getCharacterSheet(id));
    const characters = await Promise.all(characterPromises);
    res.json(characters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve character sheets' });
  }
});

app.get('/api/characters/:id', async (req, res) => {
  try {
    const character = await getCharacterSheet(req.params.id);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Check if character is public or if the user is the owner or has access
    const isOwner = req.isAuthenticated() && req.user.id === character.owner;
    const hasAccess = req.isAuthenticated() && 
                     (character.sharedWith || []).includes(req.user.email);
    
    if (!character.isPublic && !isOwner && !hasAccess) {
      // Check for PIN access
      const providedPin = req.query.pin;
      if (!providedPin || providedPin !== character.pin) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    res.json(character);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve character sheet' });
  }
});

app.put('/api/characters/:id', isAuthenticated, async (req, res) => {
  try {
    const existingCharacter = await getCharacterSheet(req.params.id);
    
    if (!existingCharacter) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    if (existingCharacter.owner !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this character' });
    }
    
    const updatedCharacter = {
      ...req.body,
      id: req.params.id,
      owner: existingCharacter.owner,
      created: existingCharacter.created,
      updated: new Date().toISOString()
    };
    
    await saveCharacterSheet(req.user.id, updatedCharacter);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update character sheet' });
  }
});

// Handle sharing settings
app.post('/api/characters/:id/share', isAuthenticated, async (req, res) => {
  try {
    const character = await getCharacterSheet(req.params.id);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    if (character.owner !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to share this character' });
    }
    
    // Update sharing settings
    character.isPublic = req.body.isPublic || false;
    character.sharedWith = req.body.sharedWith || [];
    
    // Generate or update PIN if requested
    if (req.body.generatePin) {
      character.pin = Math.floor(100000 + Math.random() * 900000).toString();
    } else if (req.body.pin) {
      character.pin = req.body.pin;
    }
    
    await saveCharacterSheet(req.user.id, character);
    
    res.json({
      isPublic: character.isPublic,
      sharedWith: character.sharedWith,
      pin: character.pin
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update sharing settings' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});