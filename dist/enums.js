// Copyright (c) 2024-2026 by Beardon Services, Inc.

const _ = require('lodash');

/**
 *
 * @param {Object} set
 * @param {number|number[]} [include]
 * @param {number|number[]} [exclude]
 * @returns {number[]}
 */
function calculateIncludes(set, include = null, exclude = null) {
    if ((set.ALL === undefined) || (set.NONE === undefined)) throw new Error('`set` without `ALL` or `NONE` values passed into `calculateIncludes`');
    if (!include) return calculateIncludes(set.ALL);
    if (!Array.isArray(include)) include = [ include ];
    if (!Array.isArray(exclude)) exclude = [ exclude ];
    if (include.includes(set.NONE)) return [ ];
    if (include.includes(set.ALL)) {
        include = _.map(set, (value) => value);
        include = _.filter(include, (value) => { return ![ set.NONE, set.ALL ].includes(value) });
    }
    include = _.filter(include, (value) => { return !exclude.includes(value) });
    return include;
}

function doesEnumInclude(set, value) {
    for (const key in set) {
        if (set[ key ] === value) return true;
    }
    return false;
}

function getEnumName(set, value) {
    const key = _.findKey(set, (v) => (v === value));
    return key ? key : '';
}

function getEnumNames(set, values, sort = true) {
    if (!values) return null;
    if (!Array.isArray(values)) return getEnumName(set, values);
    const names = values.map((value) => getEnumName(set, value));
    return (sort ? names.sort() : names);
}

const ansiColors = {
    HTTP_CLIENT_ERROR: 33, // red
    HTTP_INFORMATIONAL: 0, // white
    HTTP_REDIRECTION: 36, // blue
    HTTP_SERVER_ERROR: 31, // red
    HTTP_SUCCESSFUL: 32, // green
    LOG_LEVEL_DEBUG: 34, // blue
    LOG_LEVEL_ERROR: 31, // red
    LOG_LEVEL_HTTP: 32, // green
    LOG_LEVEL_INFO: 32, // green
    LOG_LEVEL_SILLY: 35, // magenta
    LOG_LEVEL_VERBOSE: 36, // cyan
    LOG_LEVEL_WARNING: 33, // yellow
};

const apiLogLevelCaptions = {
    DEFAULT: 'Default',
    ERROR: 'Error',
    WARNING: 'Warning',
    INFO: 'Info',
    HTTP: 'HTTP',
    VERBOSE: 'Verbose',
    DEBUG: 'Debug',
    SILLY: 'Silly',
};

const apiLogLevels = {
    DEFAULT: -1,
    ERROR: 0,
    WARNING: 1,
    INFO: 2,
    HTTP: 3,
    VERBOSE: 4,
    DEBUG: 5,
    SILLY: 6,
};

const auditFields = {
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
}

const chalkFormats = {
    ANSI: 'ansi',
    HEX: 'hex',
    RGB: 'rgb',
};

const chalkLayers = {
    BACKGROUND: 'bg',
    FOREGROUND: 'fg',
};

const databaseOperations = {
    DELETE: 'DELETE',
    INSERT: 'INSERT',
    SELECT: 'SELECT',
    TRUNCATE: 'TRUNCATE',
    UPDATE: 'UPDATE',
};

const durationUnits = {
    DAY: 'day',
    HOUR: 'hour',
    MINUTE: 'minute',
    MONTH: 'month',
    WEEK: 'week',
    YEAR: 'year',
};

const encapsulationTypes = {
    PARENTHESIS: 1,
    QUOTES: 2,
};

const encodings = {
    BASE64: 'base64',
    HEX: 'hex',
    UTF8: 'utf8',
};

const errorOrigins = {
    UNKNOWN: 0,
    NODEJS: 1,
    API: 2,
    SEQUELIZE: 3,
    VALIDATION: 4,
    PERMISSION: 5,
};

const errorSeverities = {
    NONE: 0,
    NOTICE: 1,
    WARNING: 2,
    ERROR: 3,
    FATAL: 4,
};

const expressValidatorValidationTypes = {
    ALTERNATIVE: 'alternative',
    ALTERNATIVE_GROUPED: 'alternative_grouped',
    FIELD: 'field',
    UNKNOWN_FIELDS: 'unknown_fields',
};

const hashAlgorithms = {
    MD5: 1,
    SHA1: 2,
    MD5CRYPT: 3,
    BCRYPT: 4,
};

const hexColors = {
    BLACK: '#000000',
    BLUE: '#0000FF',
    CONSOLE_WHITE: '#ECECEC',
    DB_DELETE: '#F22613',
    DB_INSERT: '#00B16A',
    DB_SELECT: '#1E90FF',
    DB_TRUNCATE: '#750505',
    DB_UPDATE: '#F9690E',
    GREEN: '#00FF00',
    HTTP_CONNECT: '#FFFFFF',
    HTTP_DELETE: '#EF968A',
    HTTP_GET: '#67D193',
    HTTP_HEAD: '#68D696',
    HTTP_OPTIONS: '#E55AA8',
    HTTP_PATCH: '#C0A8E1',
    HTTP_POST: '#F4DA7A',
    HTTP_PUT: '#74AEF6',
    HTTP_TRACE: '#FFFFFF',
    IFSTA_RED: '#B32017',
    ORANGE: '#FF8000',
    OSU_ORANGE: '#FF6600',
    RED: '#FF0000',
    VIOLET: '#FF00FF',
    YELLOW: '#FFFF00',
};

const httpContentTypes = {
    CSV: 'text/csv',
    EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    FORM_URLENCODED: 'application/x-www-form-urlencoded',
    GIF: 'image/gif',
    HTML: 'text/html',
    JSON: 'application/json',
    MULTIPART_MIXED: 'multipart/mixed',
    PDF: 'application/pdf',
    PNG: 'image/png',
    TEXT: 'text/plain',
    XML_APPLICATION: 'application/xml',
    XML_TEXT: 'text/xml',
};

const httpMethods = {
    GET: 'GET',
    HEAD: 'HEAD',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    CONNECT: 'CONNECT',
    OPTIONS: 'OPTIONS',
    TRACE: 'TRACE',
    PATCH: 'PATCH',
};

const httpRequestHeaders = {
    ACCEPT_LANGUAGE: 'Accept-Language',
    ALLOW: 'Allow',
    AUTHORIZATION: 'Authorization',
    BEARER_PREFIX: 'Bearer',
    CONTENT_TYPE: 'Content-Type',
    FORWARDED_FOR: 'X-Forwarded-For',
    REQUEST_ID: 'X-Request-Id',
    USER_AGENT: 'User-Agent',
};

const httpResponseHeaders = {
    DEPRECATED: 'X-Deprecated',
    RECORD_COUNT: 'X-Record-Count',
    SEQUELIZE: 'X-Sequelize',
    TOTAL_COUNT: 'X-Total-Count',
};

const httpStatusCodeGroups = {
    INFORMATIONAL: 1,
    SUCCESSFUL: 2,
    REDIRECTION: 3,
    CLIENT_ERROR: 4,
    SERVER_ERROR: 5,
};

const identityLevels = {
    NONE: 0,
    ANONYMOUS: 1,
    AUTHENTICATED: 2,
    ENTITLED: 4,
    STAFF: 8,
    AUTHORIZED: 16,
    ADMIN: 32,
    SYSTEM: 64,
};

const localUserStatuses = {
    INVALID_TOKEN: 'invalid_token',
    LOGIN_TIME_OUT: 'login_time_out',
    MISSING_TOKEN: 'missing_token',
    REAUTHENTICATION_REQUIRED: 'reauthentication_required',
    UNINITIALIZED: 'uninitialized',
    VALID_TOKEN: 'valid_token',
};

const metricDataTypes = {
    NATURAL: 0,
    BOOLEAN: 1,
    INTEGER: 2,
    DATE: 3,
    NUMERIC: 4,
    STRING: 5,
};

const metricExpiryUnits = {
    DAYS: 'days',
    HOURS: 'hours',
    MINUTES: 'minutes',
};

const morganFormats = {
    COMBINED: 'combined',
    COMMON: 'common',
    DEV: 'dev',
    SHORT: 'short',
    TINY: 'tiny',
};

const nodeEnvironments = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TESTING: 'testing',
};

const requestDataMediums = {
    BODY: 'body',
    QUERY: 'query',
    PARAM: 'params',
    HEADER: 'headers',
    COOKIES: 'cookies',
};

const requestFieldDataTypes = {
    UNKNOWN: 0,
    INTEGER: 1,
    STRING: 2,
    BOOLEAN: 3,
    DATE: 4,
    TIME: 5,
    DATETIME: 6,
    NUMERIC: 7,
    EMAIL_ADDRESS: 8,
    MOBILE_PHONE: 9,
    URL: 10,
    JSON: 11,
};

const requestSqlOperators = {
    GT: '>',
    GTE: '≥',
    LIKE: '*',
    LT: '<',
    LTE: '≤',
    NE: '!',
};

const sqlOperators = {
    EQ: '=',
    GT: '>',
    GTE: '>=',
    LIKE: 'LIKE',
    LT: '<',
    LTE: '<=',
    NE: '!=',
}

const winstonLogLevelNames = {
    ERROR: 'error',
    WARNING: 'warn',
    INFO: 'info',
    HTTP: 'http',
    VERBOSE: 'verbose',
    DEBUG: 'debug',
    SILLY: 'silly',
};

// using NPM logging levels
const winstonLogLevels = {
    ERROR: 0,
    WARNING: 1,
    INFO: 2,
    HTTP: 3,
    VERBOSE: 4,
    DEBUG: 5,
    SILLY: 6,
};

module.exports = {
    calculateIncludes,
    doesEnumInclude,
    getEnumName,
    getEnumNames,
    ansiColors,
    apiLogLevelCaptions,
    apiLogLevels,
    auditFields,
    chalkFormats,
    chalkLayers,
    databaseOperations,
    durationUnits,
    encapsulationTypes,
    encodings,
    errorOrigins,
    errorSeverities,
    expressValidatorValidationTypes,
    hashAlgorithms,
    hexColors,
    httpContentTypes,
    httpMethods,
    httpRequestHeaders,
    httpResponseHeaders,
    httpStatusCodeGroups,
    identityLevels,
    localUserStatuses,
    metricDataTypes,
    metricExpiryUnits,
    morganFormats,
    nodeEnvironments,
    planTypes,
    requestDataMediums,
    requestFieldDataTypes,
    requestSqlOperators,
    sqlOperators,
    winstonLogLevelNames,
    winstonLogLevels,
};
