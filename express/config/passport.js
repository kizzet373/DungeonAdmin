const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { getUserById, createUser } = require('../utils/dataStorage');

module.exports = function(passport) {
  passport.use(new GoogleStrategy({
      clientID: '828241244572-v5cet1m9akatlg0mamq34occm2bb4jqo.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: 'https://dungeonadmin.com/dungeonadmin-api/auth/google/callback'
    },
    async function(accessToken, refreshToken, profile, done) {
      try {
        let user = await getUserById(profile.id);
        if (user) {
          return done(null, user);
        }
        const newUser = await createUser({
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName
        });
        return done(null, newUser);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // In passport.js
  passport.deserializeUser(async (id, done) => {
      try {
          console.log('Deserializing user: ID from session:', id); // LOG P6 <-- What ID is here?
          const user = await getUserById(id);
          if (user) {
              console.log('Deserialized user successfully:', user.id, user.name); // LOG P7 <-- Does this fire? What user?
              done(null, user);
          } else {
              console.log('User NOT found during deserialization for ID:', id); // LOG P8 <-- Does this fire?
              done(null, false); // Important: Indicate user not found
          }
      } catch (err) {
          console.error('Error during deserialization for ID:', id, err); // LOG P9 <-- Any errors?
          done(err);
      }
  });
};