const fs = require('fs').promises;
const path = require('path');

async function getUserById(id) {
  try {
    const userDataPath = path.join(__dirname, '..', 'data', 'users', `${id}.json`);
    const userData = await fs.readFile(userDataPath, 'utf8');
    return JSON.parse(userData);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function createUser(userData) {
  const userDir = path.join(__dirname, '..', 'data', 'users');
  try {
    await fs.mkdir(userDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  const userDataPath = path.join(userDir, `${userData.id}.json`);
  await fs.writeFile(userDataPath, JSON.stringify(userData));
  return userData;
}

function generateId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function saveCharacterSheet(userId, incomingCharacterData) {
  const characterId = incomingCharacterData.id || generateId();
  const characterSheetDir = path.join(__dirname, '..', 'data', 'characters');
  const characterPath = path.join(characterSheetDir, `${characterId}.json`);

  let existingCharacterData = {};
  let currentServerVersion = 0; // Initialize server version

  try {
    const fileContent = await fs.readFile(characterPath, 'utf8');
    existingCharacterData = JSON.parse(fileContent);
    currentServerVersion = existingCharacterData._version || 0; // Get server's current version
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`Character file ${characterId}.json not found. Creating new character.`);
    } else {
      throw err;
    }
  }

  const clientVersion = incomingCharacterData._version || 0; // Get the client's version from incoming data

  // Version check: If the character exists and client version does not match server version, conflict
  if (existingCharacterData.id && clientVersion !== currentServerVersion) {
    const error = new Error(`Version mismatch. The character sheet has been updated by someone else. Character Id: ${existingCharacterData.id}, clientVersion: ${clientVersion}, serverVersion: ${currentServerVersion}`); //
    error.statusCode = 409; // Use a custom status code for conflict
    throw error;
  }

  let dataToSave = { ...existingCharacterData };
  dataToSave.id = characterId;

  if (incomingCharacterData.form !== undefined) {
    dataToSave.form = incomingCharacterData.form;
  } else if (dataToSave.form === undefined) {
    dataToSave.form = {};
  }

  if (!dataToSave.owner && userId) {
    dataToSave.owner = userId;
  }

  if (!dataToSave.created) {
    dataToSave.created = new Date().toISOString();
  }

  dataToSave.updated = new Date().toISOString();
  dataToSave._version = currentServerVersion + 1; // Increment version on successful save

  if (incomingCharacterData.isPublic !== undefined) {
      dataToSave.isPublic = incomingCharacterData.isPublic;
  }

  try {
    await fs.mkdir(characterSheetDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  await fs.writeFile(characterPath, JSON.stringify(dataToSave, null, 2));

  const user = await getUserById(userId);
  if (user && (!user.characters || !user.characters.includes(characterId))) {
    user.characters = user.characters || [];
    user.characters.push(characterId);
    const userPath = path.join(__dirname, '..', 'data', 'users', `${userId}.json`);
    await fs.writeFile(userPath, JSON.stringify(user));
  }

  return dataToSave; // Return the full dataToSave object including the new version
}

async function getCharacterSheet(characterId) {
  const characterPath = path.join(__dirname, '..', 'data', 'characters', `${characterId}.json`);
  try {
    const characterData = await fs.readFile(characterPath, 'utf8');
    return JSON.parse(characterData);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function saveUserPreferences(userId, preferences) {
    const userFilePath = path.join(__dirname, '..', 'data', 'users', `${userId}.json`);
    
    try {
        let userData = {};
        try {
            const fileContent = await fs.readFile(userFilePath, 'utf8');
            userData = JSON.parse(fileContent);
        } catch (readError) {
            if (readError.code !== 'ENOENT') {
                console.warn(`Could not read user file ${userFilePath} for update:`, readError.message);
            }
            userData = userData || {};
        }

        const updatedUserData = { ...userData, ...preferences };

        await fs.writeFile(userFilePath, JSON.stringify(updatedUserData, null, 2), 'utf8');
        console.log(`User preferences for ${userId} updated.`);
    } catch (writeError) {
        console.error(`Failed to save user preferences for ${userId}:`, writeError);
        throw writeError;
    }
}


module.exports = {
  getUserById,
  createUser,
  generateId,
  saveCharacterSheet,
  getCharacterSheet,
  saveUserPreferences
};