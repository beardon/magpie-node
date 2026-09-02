// Copyright (c) 2024-2026 by Beardon Services, Inc.

const _ = require('lodash');
const enums = require('../enums');

const { ansiColors: ac, databaseOperations: dbo, chalkFormats: cs, hexColors: hc, httpMethods: http, winstonLogLevels: wll } = enums;

const databaseOperationColors = [
    { match: dbo.DELETE, style: { format: cs.HEX, fore: hc.DB_DELETE, back: null } },
    { match: dbo.INSERT, style: { format: cs.HEX, fore: hc.DB_INSERT, back: null } },
    { match: dbo.SELECT, style: { format: cs.HEX, fore: hc.DB_SELECT, back: null } },
    { match: dbo.TRUNCATE, style: { format: cs.HEX, fore: hc.DB_TRUNCATE, back: null } },
    { match: dbo.UPDATE, style: { format: cs.HEX, fore: hc.DB_UPDATE, back: null } },
];

const httpStatusColors = [
    { range: _.range(500, 600), style: { format: cs.ANSI, fore: ac.HTTP_SERVER_ERROR, back: null } },
    { range: _.range(400, 500), style: { format: cs.ANSI, fore: ac.HTTP_CLIENT_ERROR, back: null } },
    { range: _.range(300, 400), style: { format: cs.ANSI, fore: ac.HTTP_REDIRECTION, back: null } },
    { range: _.range(200, 300), style: { format: cs.ANSI, fore: ac.HTTP_SUCCESSFUL, back: null } },
    { range: _.range(100, 200), style: { format: cs.ANSI, fore: ac.HTTP_INFORMATIONAL, back: null } },
];

const httpVerbColors = [
    { match: http.CONNECT, style: { format: cs.HEX, fore: hc.BLACK, back: hc.HTTP_CONNECT } },
    { match: http.DELETE, style: { format: cs.HEX, fore: hc.BLACK, back: hc.HTTP_DELETE } },
    { match: http.GET, style: { format: cs.HEX, fore: hc.BLACK, back: hc.HTTP_GET } },
    { match: http.HEAD, style: { format: cs.HEX, fore: hc.BLACK, back: hc.HTTP_HEAD } },
    { match: http.OPTIONS, style: { format: cs.HEX, fore: hc.BLACK, back: hc.HTTP_OPTIONS } },
    { match: http.PATCH, style: { format: cs.HEX, fore: hc.BLACK, back: hc.HTTP_PATCH } },
    { match: http.POST, style: { format: cs.HEX, fore: hc.BLACK, back: hc.HTTP_POST } },
    { match: http.PUT, style: { format: cs.HEX, fore: hc.BLACK, back: hc.HTTP_PUT } },
    { match: http.TRACE, style: { format: cs.HEX, fore: hc.BLACK, back: hc.HTTP_TRACE } },
];

const logLevelColors = [
    { match: wll.ERROR, style: { format: cs.ANSI, fore: ac.LOG_LEVEL_ERROR, back: null } },
    { match: wll.WARNING, style: { format: cs.ANSI, fore: ac.LOG_LEVEL_WARNING, back: null } },
    { match: wll.INFO, style: { format: cs.ANSI, fore: ac.LOG_LEVEL_INFO, back: null } },
    { match: wll.HTTP, style: { format: cs.ANSI, fore: ac.LOG_LEVEL_HTTP, back: null } },
    { match: wll.VERBOSE, style: { format: cs.ANSI, fore: ac.LOG_LEVEL_VERBOSE, back: null } },
    { match: wll.DEBUG, style: { format: cs.ANSI, fore: ac.LOG_LEVEL_DEBUG, back: null } },
    { match: wll.SILLY, style: { format: cs.ANSI, fore: ac.LOG_LEVEL_SILLY, back: null } },
];

module.exports = {
    databaseOperationColors,
    httpStatusColors,
    httpVerbColors,
    logLevelColors,
};
