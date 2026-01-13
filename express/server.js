const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const app = express();
const port = 3001;
const cookieParser = require('cookie-parser');

const configurePassport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const characterRoutes = require('./routes/characterRoutes');
const userRoutes = require('./routes/userRoutes');
const DEFAULT_GAME_EDITION = 'Kizzet2024'; // Define a default edition

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: '8e9457a2b01f31fb818188366d503cade8e246c02e33d3176fbde06b96df25a3',
  resave: false,
  saveUninitialized: true, // Useful for anonymous users' edition choice
  cookie: {
    // secure: process.env.NODE_ENV === 'production', // Best practice for HTTPS
    secure: false, // Assuming you are using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());

configurePassport(passport);

// Middleware to ensure req.session.edition exists
app.use((req, res, next) => {
  if (!req.session.edition) {
    req.session.edition = DEFAULT_GAME_EDITION;
  }
  next();
});

// Mount routes
app.use('/dungeonadmin-api', authRoutes);
app.use('/dungeonadmin-api', characterRoutes);
app.use('/dungeonadmin-api', userRoutes);
// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});