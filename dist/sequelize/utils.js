// Copyright (c) 2024-2026 by Beardon Services, Inc.

const _ = require('lodash');
const config = require('config');
const { Model, QueryTypes, Sequelize } = require('sequelize');

const { getSequelizeLoggingFunction } = require('./operations');

function areModels(models) {
    return _.isObject(models) && _.every(models, (model) => (model instanceof Model));
}

function doesModelUseReturning(model) {
    return isModelPostgres(model);
}

function getModelByName(models, modelName) {
    if (!areModels(models) || !_.isString(modelName)) return null;
    return _.find(models, (model) => (model.name === modelName));
}

function getModelByTableName(models, tableName) {
    if (!areModels(models) || !_.isString(tableName)) return null;
    return _.find(models, (model) => (model.tableName === tableName));
}

function getModelColumnByField(model, field) {
    if (!isModel(model) || !_.isString(field)) return null;
    const attributes = model.getAttributes();
    if (attributes.hasOwnProperty(field)) return attributes[ field ].field;
    return field;
}

function getRecordModel(models, record) {
    if (!areModels(models) || !isModel(record)) return null;
    const name = record.constructor.name;
    return getModelByName(models, name) || null;
}

function isModel(model) {
    return (model instanceof Model);
}

function isModelMariaDB(model) {
    return (isModel(model) && model.sequelize.getDialect() === 'mariadb');
}

function isModelMySQL(model) {
    return (isModel(model) && model.sequelize.getDialect() === 'mysql');
}

function isModelMySqly(model) {
    return isModelMariaDB(model) || isModelMySQL(model);
}

function isModelPostgres(model) {
    return (isModel(model) && model.sequelize.getDialect() === 'postgres');
}

function isModelReadOnly(model, readOnlyProperty = 'view') {
    return (isModel(model) && model.options.hasOwnProperty(readOnlyProperty) && model.options[ readOnlyProperty ]);
}

function isSequelize(sequelize) {
    return (sequelize instanceof Sequelize);
}

async function mysqlVersion(options) {
    const sql = 'SHOW version() AS version';
    const result = await queryFirst(sql, options);
    return _.isObject(result) ? result.version : null;
}

async function postgresVersion(options) {
    const sql = 'SHOW server_version';
    const result = await queryFirst(sql, options);
    return _.isObject(result) ? result.server_version : null;
}

async function query(sequelize, sql, options) {
    options = options || { };
    if (!isSequelize(sequelize) || !_.isString(sql)) return null;
    const defaults = {
        type: QueryTypes.SELECT,
    };
    const _options = Object.assign({ }, options);
    const target = { host: sequelize.options.host, database: sequelize.options.database };
    _.defaults(_options, defaults, target);
    _options.logging = getSequelizeLoggingFunction(_options);
    const results = await sequelize.query(sql, _options);
    if (!results) return null;
    switch (_options.type) {
        case QueryTypes.SELECT: {
            if (!_.isArray(results) || !results.length) return null;
            return results;
        }
        default: return results;
    }
}

async function queryFirst(sequelize, sql, options) {
    const results = await query(sequelize, sql, options);
    if (!_.isArray(results) || !results.length) return null;
    return results[ 0 ];
}

function unloadDeprecated(models, databaseName = null) {
    if (!areModels(models)) return;
    const CONFIG_SUPPRESS_DEPRECATED_FIELD_UNLOADING = 'environment.suppressDeprecatedFieldUnloading';
    const CONFIG_SUPPRESS_DEPRECATED_TABLE_UNLOADING = 'environment.suppressDeprecatedTableUnloading';
    const databaseDisplayName = !_.isNull(databaseName) ? `[${ databaseName }]` : null;
    if (config.has(CONFIG_SUPPRESS_DEPRECATED_TABLE_UNLOADING) && !config.get(CONFIG_SUPPRESS_DEPRECATED_TABLE_UNLOADING)) {
        const deprecatedTables = unloadDeprecatedTables(models);
        const deprecatedTablesCount = deprecatedTables.length;
        if (deprecatedTablesCount > 0) app.locals.logger.debug(_.compact([ databaseDisplayName, `${ deprecatedTablesCount } deprecated tables unloaded` ]).join(' '));
    }
    if (config.has(CONFIG_SUPPRESS_DEPRECATED_FIELD_UNLOADING) && !config.get(CONFIG_SUPPRESS_DEPRECATED_FIELD_UNLOADING)) {
        let deprecatedFieldTables = [ ];
        for (const key in models) {
            const removedFields = unloadDeprecatedFields(models[ key ]);
            if (removedFields) deprecatedFieldTables.push({ table: key, fields: removedFields });
        }
        const deprecatedFieldsCount = _.reduce(deprecatedFieldTables, (sum, value) => {
            return sum + value.fields.length
        }, 0);
        if (deprecatedFieldsCount > 0) app.locals.logger.debug(_.compact([ databaseDisplayName, `${ deprecatedFieldsCount } deprecated fields unloaded` ]).join(' '));
    }
}

function unloadDeprecatedFields(model) {
    if (!isModel(model)) return [ ];
    const removed = [ ];
    _.forEach(model.getAttributes(), (field, key) => {
        if (field.deprecated) {
            model.removeAttribute(key);
            removed.push(key);
        }
    });
    return _.isEmpty(removed) ? [ ] : removed;
}

function unloadDeprecatedTables(models) {
    if (_.isObject(models)) return [ ];
    const removed = [ ];
    for (const key in models) {
        if (_.isObject(models[ key ]) && _.isObject(models[ key ].options) && models[ key ].options.deprecated) {
            delete models[ key ];
            removed.push(key);
        }
    }
    return removed;
}

function unloadField(tableName, field) {
    const model = getModelByTableName(tableName);
    if (!isModel(model) || !_.isString(field)) return false;
    for (const [ key, _field ] of Object.entries(model.getAttributes())) {
        if (_field.field === field) {
            model.removeAttribute(key);
            return true;
        }
    }
    return false;
}

module.exports = {
    doesModelUseReturning,
    getModelColumnByField,
    getRecordModel,
    isModel,
    isModelMariaDB,
    isModelMySQL,
    isModelMySqly,
    isModelPostgres,
    isModelReadOnly,
    isSequelize,
    mysqlVersion,
    postgresVersion,
    query,
    queryFirst,
    unloadDeprecated,
    unloadDeprecatedFields,
    unloadDeprecatedTables,
    unloadField,
};
