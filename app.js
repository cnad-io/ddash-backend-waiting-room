'use strict';

var logger = require('pino')({
  'level': process.env.LOG_LEVEL || 'info'
});

logger.info('Starting server with port 8080.');
var app = require('http').createServer(function (req, res) {
  if (req.method === 'GET' && req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.write('{ "message": "ok" }');
    res.end();
  }
});

var io = require('socket.io')(app);

logger.info('Setting acepted origins.');
io.origins('*:*');

var redis = require('socket.io-redis');

if (process.env.REDIS_ADAPTER_URL) {
  logger.info('Integrating with Redis.');
  var redisConnection = {
    host: process.env.REDIS_ADAPTER_URL || 'redis-waiting-room',
    port: 6379
  };
  logger.debug('Redis configuration.', redisConnection);
  io.adapter(redis(redisConnection));
}

require('./socket')(io);

var port = process.env.PORT || 3000;

app.listen(port, function () {
  logger.info('Server started and ready to receive requests');
});

module.exports = {
  server: app,
  ws: io
};
