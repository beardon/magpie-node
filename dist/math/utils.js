// Copyright (c) 2024-2026 by Beardon Services, Inc.

const _ = require('lodash');

function convertBytes(bytes, options = { }) {
    options = options || { };
    if (!bytes) return null;
    const useBinaryUnits = _.isBoolean(options.useBinaryUnits) ? options.useBinaryUnits : false;
    const decimals = _.isInteger(options.decimals) ? options.decimals : 2;
    const spaced = _.isBoolean(options.spaced) ? options.spaced : false;
    const base = useBinaryUnits ? 1024 : 1000;
    const units = useBinaryUnits
        ? [ 'B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB' ]
        : [ 'B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
    const i = Math.floor(Math.log(bytes) / Math.log(base));
    const size = bytes / Math.pow(base, i)
    const sizeFixed = !_.isNaN(size) ? size.toFixed(decimals) : 0;
    const unit = !_.isNaN(size) ? units[ i ] : units[ 0 ];
    return `${ sizeFixed }${ spaced ? ' ' : '' }${ unit }`;
}

function round(value, decimals = 2) {
    if (!_.isNumber(value)) return value;
    const rounder = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * rounder) / rounder;
}

module.exports = {
    convertBytes,
    round,
};
