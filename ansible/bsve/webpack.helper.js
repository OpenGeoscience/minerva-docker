module.exports = function (config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['Hammer'] = 'hammerjs/hammer.js';
    return config;
}
