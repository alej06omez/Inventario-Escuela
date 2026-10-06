const mongoose = require('mongoose');

// Todas las respuestas JSON muestran "id" en lugar de "_id" y sin "__v".
mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (documento, json) => {
    delete json._id;
  },
});

function conectar(uri = process.env.MONGODB_URI || '') {
  return mongoose.connect(uri);
}

module.exports = { conectar };
