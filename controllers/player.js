"use strict";

var logger = require('pino')({
  'level': process.env.LOG_LEVEL || 'info'
});

var validate = function (userName) {
  logger.info('Validating player info');
  // integrar con servicio de administración de usuarios.
  return userName;
};

module.exports = {
  validate: validate
}
