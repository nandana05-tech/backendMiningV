const crypto = require('crypto');

module.exports = {
  SECRET_KEY: crypto
    .createHash('sha256')
    .update(String('kuncirahasia'))
    .digest()
};