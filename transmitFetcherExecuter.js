'use strict';
require('./lib/helpers/config.helper');
const { start, stop } = require('./lib/services/transmit');

/**
 * Start service
 */
start();

/**
 * Finalize on SIGINT
 */
process.on('SIGINT', () => {
  stop();
  process.exit(0);
});
