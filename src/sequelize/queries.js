// Copyright (c) 2024-2026 by Beardon Services, Inc.

const _ = require('lodash');
const { QueryTypes } = require('sequelize');

const { getSequelizeLoggingFunction } = require('./operations');
const { isSequelize } = require('./sequelizes');

async function executeQuery(sequelize, sql, options) {
    options = options || { };
    if (!isSequelize(sequelize) || !_.isString(sql)) return null;
    const defaults = {
        type: QueryTypes.SELECT,
    };
    const _options = Object.assign({ }, options);
    const target = { host: sequelize.options.host, database: sequelize.options.database };
    _.defaults(_options, defaults, target);
    _options.logging = getSequelizeLoggingFunction(_options);
    const results = await sequelize.executeQuery(sql, _options);
    if (!results) return null;
    switch (_options.type) {
        case QueryTypes.SELECT: {
            if (!_.isArray(results) || !results.length) return null;
            return results;
        }
        default: return results;
    }
}

async function executeQueryFirst(sequelize, sql, options) {
    const results = await executeQuery(sequelize, sql, options);
    if (!_.isArray(results) || !results.length) return null;
    return results[ 0 ];
}

module.exports = {
    executeQuery,
    executeQueryFirst,
    query: executeQuery,
    queryFirst: executeQueryFirst,
};
