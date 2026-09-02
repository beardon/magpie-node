// Copyright (c) 2024-2026 by Beardon Services, Inc.

const _ = require('lodash');

const { executeQueryFirst } = require('./queries');

async function mysqlVersion(options) {
    const sql = 'SHOW version() AS version';
    const result = await executeQueryFirst(sql, options);
    return _.isObject(result) ? result.version : null;
}

async function postgresVersion(options) {
    const sql = 'SHOW server_version';
    const result = await executeQueryFirst(sql, options);
    return _.isObject(result) ? result.server_version : null;
}

module.exports = {
    mysqlVersion,
    postgresVersion,
};
