// Copyright (c) 2026 by Beardon Services, Inc.

const { cacheTtls, clearCache, listCache } = require('./caches');
const { callStoredFunction } = require('./stored_functions');
const { areModels, doesModelUseReturning, getModelByName, getModelByTableName, getModelColumnByField, getRecordModel,
    isModel, isModelMariaDB, isModelMySQL, isModelMySqly, isModelPostgres, isModelReadOnly } = require('./models');
const { executeQuery, executeQueryFirst } = require('./queries');
const { getSequelizeLoggingFunction, getTimezoneOffset, model, validateSchema } = require('./operations');
const { isSequelize } = require('./sequelizes');
const { mysqlVersion, postgresVersion } = require('./versions');

module.exports = {
    areModels,
    cacheTtls,
    callStoredFunction,
    clearCache,
    doesModelUseReturning,
    executeQuery,
    executeQueryFirst,
    getModelByName,
    getModelByTableName,
    getModelColumnByField,
    getRecordModel,
    getSequelizeLoggingFunction,
    getTimezoneOffset,
    isModel,
    isModelMariaDB,
    isModelMySQL,
    isModelMySqly,
    isModelPostgres,
    isModelReadOnly,
    isSequelize,
    listCache,
    model,
    mysqlVersion,
    postgresVersion,
    validateSchema,
    caches: { cacheTtls, clearCache, listCache },
    models: { areModels, doesModelUseReturning, getModelByName, getModelByTableName, getModelColumnByField, getRecordModel,
        isModel, isModelMariaDB, isModelMySQL, isModelMySqly, isModelPostgres, isModelReadOnly },
    operations: { getSequelizeLoggingFunction, getTimezoneOffset, model, validateSchema },
    queries: { executeQuery, executeQueryFirst },
    sequelizes: { isSequelize },
    storedFunctions: { callStoredFunction },
    versions: { mysqlVersion, postgresVersion },
};
