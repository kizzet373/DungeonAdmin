const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { saveCharacterSheet, getCharacterSheet, getUserById } = require('../utils/dataStorage');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { constants } = require('fs');

// Character sheet routes
router.post('/characters', isAuthenticated, async (req, res) => {
  try {
    const characterId = await saveCharacterSheet(req.user.id, req.body);
    res.status(201).json({ id: characterId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `Failed to save character sheet: ${err.message}` });
  }
});

router.get('/characters', isAuthenticated, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user || !user.characters) {
      return res.json([]);
    }
    const characterPromises = user.characters.map(id => getCharacterSheet(id));
    const characters = (await Promise.all(characterPromises)).filter(c => c !== null); // Filter out nulls if a sheet was deleted but ref still exists
    res.json(characters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve character sheets' });
  }
});

router.get('/characters/:id', async (req, res) => {
  try {
    const character = await getCharacterSheet(req.params.id);

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const isOwner = req.isAuthenticated() && req.user.id === character.owner;
    const hasAccess = req.isAuthenticated() &&
                     (character.sharedWith || []).includes(req.user.email);

    if (!character.isPublic && !isOwner && !hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    character.isOwner = isOwner;
    res.json(character);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve character sheet' });
  }
});

router.put('/characters/:id', isAuthenticated, async (req, res) => {
  try {
    const existingCharacter = await getCharacterSheet(req.params.id);

    if (!existingCharacter) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (existingCharacter.owner !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this character' });
    }

    const updatedCharacterData = {
      ...req.body,
      id: req.params.id,
      owner: existingCharacter.owner,
      created: existingCharacter.created,
      // _version will be passed from the client in req.body
    };

    // saveCharacterSheet now returns the full updated character data
    const savedCharacter = await saveCharacterSheet(req.user.id, updatedCharacterData);
    res.json(savedCharacter); // Return the full updated character data, including the new _version
  } catch (err) {
    console.error(err);
    if (err.statusCode === 409) { // Check for the custom status code from dataStorage.js
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: `Failed to update character sheet: ${err.message}` });
  }
});

router.post('/characters/:id/share', isAuthenticated, async (req, res) => {
  try {
    const character = await getCharacterSheet(req.params.id);

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (character.owner !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to share this character' });
    }

    character.isPublic = req.body.isPublic || false;
    character.sharedWith = req.body.sharedWith || [];

    if (req.body.generatePin) {
      character.pin = Math.floor(100000 + Math.random() * 900000).toString();
    } else if (req.body.pin) {
      character.pin = req.body.pin;
    } else if (req.body.removePin) {
      delete character.pin;
    }

    await saveCharacterSheet(req.user.id, character);

    res.json({
      isPublic: character.isPublic,
      sharedWith: character.sharedWith,
      pin: character.pin
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `Failed to update sharing settings: ${err.message}` });
  }
});

router.delete('/characters/:id', isAuthenticated, async (req, res) => {
  const characterIdToDelete = req.params.id;
  const userId = req.user.id;

  try {
    const characterPath = path.join(__dirname, '..', 'data', 'characters', `${characterIdToDelete}.json`);
    const userPath = path.join(__dirname, '..', 'data', 'users', `${userId}.json`);

    let characterData;
    try {
      const data = await fs.readFile(characterPath, 'utf8');
      characterData = JSON.parse(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Character not found' });
      }
      throw err; // Propagate other errors
    }

    if (characterData.owner !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this character' });
    }

    await fs.unlink(characterPath);
    console.log(`Character ${characterIdToDelete} file deleted.`);

    if (characterData.form && characterData.form.character_image_path) {
      try {
        const imageName = path.basename(characterData.form.character_image_path);
        const imagePath = path.join(__dirname, '..', 'uploads', 'characters', imageName);
        await fs.unlink(imagePath);
        console.log(`Character image ${imageName} for character ${characterIdToDelete} deleted.`);
      } catch (imgErr) {
        if (imgErr.code !== 'ENOENT') { // Log error if it's not "file not found"
          console.error('Error deleting character image:', imgErr);
        }
      }
    }

    const userData = await getUserById(userId);
    if (userData && userData.characters) {
      userData.characters = userData.characters.filter(id => id !== characterIdToDelete);
      await fs.writeFile(userPath, JSON.stringify(userData));
      console.log(`User ${userId}'s character list updated.`);
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting character:', err);
    res.status(500).json({ error: `Failed to delete character: ${err.message}` });
  }
});

// Set up upload middleware
function uploadWithFieldName(characterId) {
  const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
      const dir = path.join(__dirname, '..', 'uploads', 'characters');
      try {
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
      } catch (err) {
        cb(err);
      }
    },
    filename: function (req, file, cb) {
      const fileExt = path.extname(file.originalname);
      cb(null, `character_${characterId}${fileExt}`);
    }
  });

  return multer({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: function (req, file, cb) {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
      }
      cb(null, true);
    }
  }).single(`character_image_${characterId}`); // Field name must match client-side
}

router.post('/upload-character-image/:characterId', isAuthenticated, (req, res, next) => {
  const uploadMiddleware = uploadWithFieldName(req.params.characterId);
  uploadMiddleware(req, res, function (err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const characterId = req.params.characterId;
    const character = await getCharacterSheet(characterId);

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (character.owner !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this character' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const imageUrl = `/dungeonadmin-api/character-image/${req.file.filename}`;

    if (!character.form) character.form = {};
    character.form.character_image_path = imageUrl;

    const clientVersion = parseInt(req.body._version, 10) || 0;

    const dataToSave = {
      ...character,
      form: character.form,
      _version: clientVersion,
      updated: new Date().toISOString()
    };

    const savedCharacter = await saveCharacterSheet(req.user.id, dataToSave);

    res.json({
      success: true,
      imageUrl: imageUrl,
      _version: savedCharacter._version
    });
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: `Failed to upload image: ${err.message}` });
  }
});

router.get('/character-image/:filename', async (req, res) => {
  const filename = req.params.filename;
  // Basic validation for filename to prevent directory traversal
  if (!filename.match(/^character_[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif)$/i)) {
    return res.status(400).send('Invalid filename.');
  }
  const filePath = path.join(__dirname, '..', 'uploads', 'characters', filename);
  try {
    await fs.access(filePath, constants.R_OK); // Check if file exists and is readable
    res.sendFile(filePath);
  } catch (error) {
    // If file does not exist or is not accessible
    console.error(`Error serving image ${filename}:`, error);
    res.status(404).send('Image not found.');
  }
});

module.exports = router;