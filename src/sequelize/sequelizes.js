// Copyright (c) 2024-2026 by Beardon Services, Inc.

const { Sequelize: Sequelizes } = require('sequelize');

function isSequelize(sequelize) {
    return (sequelize instanceof Sequelizes);
}

module.exports = {
    isSequelize,
};
