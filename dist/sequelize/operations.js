// Copyright (c) 2024-2026 by Beardon Services, Inc.

const _ = require('lodash');
const { camelCase } = require('change-case');
const config = require('config');
const { DateTime } = require('luxon');
const { log, winstonLogLevelIdToName } = require('zeddemore-logger');
const pluralize = require('pluralize');
const { QueryTypes } = require('sequelize');

const { chalkDatabaseOperations } = require('../console/color');
const { doesModelUseReturning, isModel } = require('./utils');
const enums = require('../enums');

const { auditFields: af, winstonLogLevels: wll } = enums;

function buildModel(model, values) {
    if (!isModel(model) || !_.isObject(values)) return null;
    const instance = model.build(values);
    return instance.toJSON();
}

async function bulkCreateModel(model, records, options) {
    if (!isModel(model) || !_.isArray(records)) return [ ];
    options = options || { };
    const _options = Object.assign({ }, options);
    _options.logging = getSequelizeLoggingFunction({ ..._options, model });
    return model.bulkCreate(records, _options);
}

function colorizeSequelizeLog(message) {
    if (!_.isString(message)) return '';
    let colorizedMessage = message;
    for (const key in enums.databaseOperations) {
        const operation = enums.databaseOperations[ key ];
        colorizedMessage = chalkDatabaseOperations(operation, colorizedMessage);
    }
    return colorizedMessage;
}

function compareRecords(recordA, recordB, ignoreFields = [ af.UPDATED_AT ]) {
    function massageValue(value) {
        if (_.isDate(value)) return DateTime.fromJSDate(value).toUnixInteger();
        return value;
    }
    const changed = [ ];
    for (const field in recordA) {
        const valueA = massageValue(recordA[ field ]);
        const valueB = (recordB.hasOwnProperty(field) ? massageValue(recordB[ field ]) : null);
        if (!ignoreFields.includes(field) && (valueA !== valueB)) changed.push(field);
    }
    return changed;
}

async function countModel(model, options) {
    if (!isModel(model)) return 0;
    options = options || { };
    const _options = Object.assign({ }, options);
    _options.logging = getSequelizeLoggingFunction({ ..._options, model });
    return model.count(_.omit(_options, [ 'attributes', 'order' ]));
}

async function createModel(model, values, options) {
    if (!isModel(model) || !_.isObject(values)) return null;
    options = options || { };
    const _options = Object.assign({ raw: false }, options);
    _options.logging = getSequelizeLoggingFunction({ ..._options, model });
    const isReturningSet = _options.hasOwnProperty('returning');
    if (!isReturningSet) _options.returning = true;
    const instance = await model.create(values, _options);
    if (_options.returning && !doesModelUseReturning(model)) {
        delete _options.returning;
        await instance.reload(_options);
    }
    const record = instance.toJSON();
    if (_.isObject(record) && (_options.meta !== false)) record._model = model.name;
    return record;
}

async function destroyModel(model, destroyCallback = null, updateCallback = null, options) {
    function buildDeletedResponse(_model, deletedCount) {
        const response = { };
        response[ `${ pluralize(camelCase(_model.name)) }Deleted` ] = deletedCount;
        return response;
    }
    if (!isModel(model)) return null;
    options = options || { };
    const _options = Object.assign({ }, options);
    _options.logging = getSequelizeLoggingFunction({ ..._options, model });
    const cascade = (_options.cascade !== false);
    delete _options.cascade;
    const returnJson = (_options.json !== false);
    delete _options.json;
    const usingCallbacks = (_.isFunction(destroyCallback) || _.isFunction(updateCallback));
    let associationsDeleted = null;
    let associationsUpdated = null;
    if (cascade && usingCallbacks) {
        const logLevel = !_.isNil(_options.logLevel) ? _options.logLevel : wll.DEBUG;
        associationsDeleted = _.isFunction(destroyCallback) ? await destroyCallback(model, { ..._options, logLevel }) : null;
        associationsUpdated = _.isFunction(updateCallback) ? await updateCallback(model, { ..._options, logLevel }) : null;
    }
    const deleted = await model.destroy(_options);
    if (!returnJson) return deleted;
    let response = buildDeletedResponse(model, deleted);
    if (usingCallbacks) Object.assign(response, associationsDeleted, associationsUpdated);
    return response;
}

async function destroyModelById(model, id, options) {
    if (!isModel(model) || _.isNil(id)) return null;
    return destroyModel(model, { ...options, where: { id } });
}

async function existsModel(model, options) {
    if (!isModel(model)) return false;
    const recordCount = await countModel(model, options);
    return (recordCount > 0);
}

async function existsModelById(model, id, options) {
    if (!isModel(model) || _.isNil(id)) return false;
    options = options || { };
    return existsModel(model, { ...options, where: { id } });
}

async function findAllModels(model, options) {
    if (!isModel(model)) return [ ];
    options = options || { };
    const _options = Object.assign({ }, options);
    _options.limit = _options.limit || config.get('databases.maxRows');
    _options.logging = getSequelizeLoggingFunction({ ..._options, model });
    _.defaults(_options, { raw: true });
    const records = await model.findAll(_options);
    for (const record of records) {
        if (_options.meta !== false) record._model = model.name;
    }
    return records;
}

async function findAndCountAllModels(model, options) {
    function needsFullCount(records, limit, offset) {
        if (!!offset) return true;
        const functionalLimit = limit || config.get('databases.maxRows');
        return (records.length >= functionalLimit);
    }
    if (!isModel(model)) return [ [ ], 0 ];
    options = options || { };
    const records = await findAllModels(model, options);
    const logLevel = !_.isNil(options.logLevel) ? options.logLevel : wll.DEBUG;
    const totalCount = needsFullCount(records, options.limit, options.offset) ? await countModel(model, { ...options, logLevel }) : records.length;
    return [ records, totalCount ];
}

async function findOneModel(model, options) {
    if (!isModel(model)) return null;
    options = options || { };
    const _options = Object.assign({ }, options);
    _options.logging = getSequelizeLoggingFunction({ ..._options, model });
    _.defaults(_options, { raw: true });
    const record = await model.findOne(_options);
    if (_.isObject(record) && (_options.meta !== false)) record._model = model.name;
    return record;
}

async function findOneModelById(model, id, options) {
    if (!isModel(model) || _.isNil(id)) return null;
    if (_.isObject(id)) throw new Error('Object passed as `id` into `findOneModelById`');
    options = options || { };
    return findOneModel(model, { ...options, where: { id } });
}

function getModelFieldAttributes(model, properties = [ 'fieldName', 'field', 'access' ]) {
    if (!isModel(model) || !_.isArray(properties) || !properties.length) return [ ];
    const fields = [ ];
    const attributes = model.getAttributes();
    for (const key in attributes) {
        fields.push(_.pick(attributes[ key ], properties));
    }
    return fields;
}

function getSequelizeLoggingFunction(options) {
    options = options || { };
    const targetHost = options.target ? options.target.host : (isModel(options.model) ? options.model.sequelize.options.host : null);
    const targetDatabase = options.target ? options.target.database : (isModel(options.model) ? options.model.sequelize.options.database : null);
    const logLevel = !_.isNil(options.logLevel) ? options.logLevel : wll.VERBOSE;
    const target = `${ targetHost }:${ targetDatabase }`;
    const logOptions = { target };
    if (_.isObject(options.caller)) logOptions.caller = options.caller;
    if (_.isString(options.logPrefix)) logOptions.prefix = colorizeSequelizeLog(options.logPrefix);
    return (msg) => log(options)[ winstonLogLevelIdToName(logLevel) ](colorizeSequelizeLog(msg), logOptions);
}

function getTimezoneOffset(timezone) {
    if (!_.isString(timezone) || !timezone.length) return '+00:00';
    const tz = DateTime.local().setZone(timezone);
    const hours = Math.floor(tz.offset / 60).toLocaleString('en-US', { minimumIntegerDigits: 2 });
    const minutes = Math.abs(tz.offset % 60).toLocaleString('en-US', { minimumIntegerDigits: 2 });
    return `${ hours }:${ minutes }`;
}

async function optimizeModel(model, options) {
    if (!isModel(model)) return null;
    options = options || { };
    const _options = Object.assign({ }, options);
    _options.logging = getSequelizeLoggingFunction({ ..._options, model });
    return model.sequelize.query(`OPTIMIZE TABLE ${ model.tableName };`, { type: QueryTypes.RAW, ..._options });
}

async function truncateModel(model, options) {
    if (!isModel(model)) return null;
    options = options || { };
    const _options = Object.assign({ }, options);
    _options.logging = getSequelizeLoggingFunction({ ..._options, model });
    return model.destroy({ truncate: true, ..._options });
}

async function updateModelById(model, id, values, options) {
    if (!isModel(model) || _.isNil(id) || !_.isObject(values)) return null;
    options = options || { };
    const _options = Object.assign({ }, options);
    _options.logging = getSequelizeLoggingFunction({ ..._options, model });
    const generateDiff = _options.diff;
    delete _options.diff;
    let oldRecord = null;
    if (generateDiff) {
        const logLevel = !_.isNil(_options.logLevel) ? _options.logLevel : wll.DEBUG;
        oldRecord = await findOneModelById(model, id, { ..._options, logLevel });
    }
    const newRecord = await updateModel(model, values, { ..._options, where: { id } });
    if (generateDiff && _.isObject(oldRecord)) newRecord.changed = compareRecords(oldRecord, newRecord);
    return newRecord;
}

async function updateModel(model, values, options) {
    if (!isModel(model) || !_.isObject(values)) return null;
    options = options || { };
    const _options = Object.assign({ }, options);
    _options.logging = getSequelizeLoggingFunction({ ..._options, model });
    const isReturningSet = _options.hasOwnProperty('returning');
    if (!isReturningSet) _options.returning = true;
    const result = await model.update(values, _options);
    if (!result || !_.isArray(result) || (result.length < 1)) return (_options.returning ? null : 0);
    if (!_options.returning) return result[ 0 ];
    let record;
    if (!doesModelUseReturning(model)) {
        delete _options.returning;
        _.defaults(_options, { raw: true });
        const logLevel = !_.isNil(_options.logLevel) ? _options.logLevel : wll.DEBUG;
        record = await model.findOne({ ..._options, logLevel });
    } else {
        const instances = (result.length > 1) ? result[ 1 ] : null;
        const instance = (_.isArray(instances) && !!instances.length) ? instances[ 0 ] : null;
        if (instance) record = instance.toJSON();
    }
    if (record && (_options.meta !== false)) record._model = model.name;
    return record;
}

async function upsertModel(model, values, options) {
    if (!isModel(model) || !_.isObject(values)) return null;
    options = options || { };
    const _options = Object.assign({ }, options);
    _options.logging = getSequelizeLoggingFunction({ ...options, model });
    const isReturningSet = _options.hasOwnProperty('returning');
    if (!isReturningSet) _options.returning = true;
    const [ instance, created ] = await model.upsert(values, _options);
    let record;
    if (!_options.returning || doesModelUseReturning(model)) {
        record = instance.toJSON();
    } else if (created) {
        await instance.reload();
        record = instance.toJSON();
    }
    else {
        delete _options.returning;
        let where = values;
        if (options.conflictFields) {
            where = { };
            for (const conflictField of options.conflictFields) {
                where[ conflictField ] = values[ conflictField ];
            }
        }
        _.defaults(_options, { raw: true, where });
        const logLevel = !_.isNil(_options.logLevel) ? _options.logLevel : wll.DEBUG;
        record = await model.findOne({ ..._options, logLevel });
    }
    if (record && (_options.meta !== false)) record._model = model.name;
    return record;
}

async function validateSchema(validationOptions, options) {
    function buildValidationResponse(validation) {
        const response = Object.assign({ }, validation);
        for (const table of response.tables) {
            table.valid = _.every(table.columns, (column) => column.valid);
        }
        const allValid = _.every(response.tables, (table) => table.valid);
        response.valid = allValid;
        response.invalids = !allValid ? _.map(validation.tables, (table) => _.flatten(_.map(table.columns, (column) => `${ validation.schema }.${ table.name }.${ column.name }`)).join(', ')) : [ ];
        delete(response.failureCallback);
        return response;
    }
    options = options || { };
    const _database = validationOptions.database;
    const _critical = validationOptions.critical || false;
    const _failureCallback = validationOptions.failureCallback || null;
    const _schema = validationOptions.schema;
    const validation = { critical: _critical, schema: _schema, tables: validationOptions.tables };
    for (const table of validation.tables) {
        for (const column of table.columns) {
            const sql = `SELECT ${ column.name } FROM ${ validation.schema }.${ table.name } LIMIT 1;`;
            try {
                await _database.query(sql, options);
                column.valid = true;
            } catch (e) {
                column.valid = false;
            }
        }
    }
    if (_.isFunction(_failureCallback)) await _failureCallback(validation, options);
    return buildValidationResponse(validation);
}

module.exports = {
    getSequelizeLoggingFunction,
    getTimezoneOffset,
    model: {
        attributes: getModelFieldAttributes,
        build: buildModel,
        bulkCreate: bulkCreateModel,
        count: countModel,
        create: createModel,
        destroy: destroyModel,
        destroyById: destroyModelById,
        exists: existsModel,
        existsById: existsModelById,
        findAll: findAllModels,
        findAndCountAll: findAndCountAllModels,
        findOne: findOneModel,
        findOneById: findOneModelById,
        optimize: optimizeModel,
        truncate: truncateModel,
        update: updateModel,
        updateById: updateModelById,
        upsert: upsertModel,
    },
    validateSchema,
};
