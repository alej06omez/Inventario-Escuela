const mongoose = require('mongoose');

const { MONGODB_URI } = process.env;


mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (documento, json) => {
    delete json._id;
  },
});

function conectar(uri = MONGODB_URI) {
  return mongoose.connect(uri);
}

module.exports = { conectar };
