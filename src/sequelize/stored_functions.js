// Copyright (c) 2024-2026 by Beardon Services, Inc.

const _ = require('lodash');
const { log } = require('zeddemore-logger');

const enums = require('../enums');
const { executeQueryFirst } = require('./queries');

const { winstonLogLevels: wll } = enums;

async function callStoredFunction(sequelize, sql, replacements = null, options) {
    options = options || { };
    const _options = Object.assign({ }, options);
    _options.logLevel = !_.isNil(_options.logLevel) ? _options.logLevel : wll.DEBUG;
    const _sql = `${ sql } AS value`;
    try {
        const result = await executeQueryFirst(sequelize, _sql, { replacements, ..._options });
        return (_.isObject(result)) ? result.value : null;
    } catch (e) {
        log(_options).error(e);
        return null;
    }
}

module.exports = {
    callStoredFunction,
};
