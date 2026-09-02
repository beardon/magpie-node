// Copyright (c) 2024-2026 by Beardon Services, Inc.

const _ = require('lodash');
const { Model } = require('sequelize');

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

module.exports = {
    areModels,
    doesModelUseReturning,
    getModelByName,
    getModelByTableName,
    getModelColumnByField,
    getRecordModel,
    isModel,
    isModelMariaDB,
    isModelMySQL,
    isModelMySqly,
    isModelPostgres,
    isModelReadOnly,
};
