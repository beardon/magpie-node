// Copyright (c) 2024-2026 by Beardon Services, Inc.

const _ = require('lodash');
const chalk = require('chalk');

const colorMappings = require('../color/color_mappings');
const enums = require('../enums');

const { chalkLayers: cl, chalkFormats: cf } = enums;

/**
 * @param ansiColor {number}
 * @param layer {string}
 * @param string {string}
 * @returns {string}
 */
function chalkAnsi(ansiColor, layer = cl.FOREGROUND, string) {
    if (!string) return '';
    if (!ansiColor) return string;
    switch (layer) {
        case cl.BACKGROUND: return `\x1B[${ ansiColor }m${ string }\x1B[49m`;
        case cl.FOREGROUND: return `\x1B[${ ansiColor }m${ string }\x1B[39m`;
        default: return string;
    }
}

function chalkDatabaseOperation(operation, string = null) {
    return chalkMatch(operation, string, colorMappings.databaseOperationColors);
}

function chalkDatabaseOperations(operation, string = null, replaceGlobal = true) {
    if (!string) string = operation;
    return chalkViaColorMap(operation, string, colorMappings.databaseOperationColors, replaceGlobal);
}

/**
 * @param hexColor {string}
 * @param layer {string}
 * @param string {string}
 * @returns {string}
 */
function chalkHex(hexColor, layer = cl.FOREGROUND, string) {
    if (!string) return '';
    if (!hexColor) return string;
    hexColor = (hexColor[ 0 ] === '#') ? hexColor : `#${ hexColor }`;
    switch (layer) {
        case cl.BACKGROUND: return chalk.bgHex(hexColor)(string);
        case cl.FOREGROUND: return chalk.hex(hexColor)(string);
        default: return string;
    }
}

function chalkHttpStatuses(statusCode, string = null) {
    if (!string) string = statusCode;
    const colorMap = _.find(colorMappings.httpStatusColors, (httpStatusColor) => httpStatusColor.range.includes(string));
    if (!colorMap || !colorMap.style) return string;
    let chalkedMatch = string;
    if (colorMap.style.fore) chalkedMatch = `\x1B[${ colorMap.style.fore }m${ string }\x1B[39m`;
    return chalkedMatch;
}

function chalkHttpVerb(verb, string = null) {
    return chalkMatch(verb, string, colorMappings.httpVerbColors);
}

function chalkHttpVerbs(verb, string = null, replaceGlobal = false) {
    if (!string) string = verb;
    return chalkViaColorMap(verb, string, colorMappings.httpVerbColors, replaceGlobal);
}

function chalkLogLevel(logLevel, string = null) {
    return chalkMatch(logLevel, string, colorMappings.logLevelColors);
}

function chalkMatch(match, string, colorsMap) {
    if (!string) string = match;
    const colorMap = _.find(colorsMap, { match });
    if (!colorMap || !colorMap.style) return string;
    return chalkTarget(string, colorMap.style);
}

/**
 * @param redColor {number}
 * @param greenColor {number}
 * @param blueColor {number}
 * @param layer {string}
 * @param string {string}
 * @returns {string}
 */
function chalkRgb(redColor, greenColor, blueColor, layer = cl.FOREGROUND, string) {
    if (!string) return '';
    if (!redColor || !greenColor || !blueColor) return string;
    switch (layer) {
        case cl.BACKGROUND: return chalk.bgRgb(redColor, greenColor, blueColor)(string);
        case cl.FOREGROUND: return chalk.rgb(redColor, greenColor, blueColor)(string);
        default: return string;
    }
}

function chalkTarget(target, style) {
    if (!style) return target;
    const fore = style.fore;
    const back = style.back;
    switch (style.format) {
        case cf.ANSI: return chalkAnsi(back, cl.BACKGROUND, chalkAnsi(fore, cl.FOREGROUND, target));
        case cf.HEX: return chalkHex(back, cl.BACKGROUND, chalkHex(fore, cl.FOREGROUND, target));
        case cf.RGB: return chalkRgb(back.r, back.g, back.b, cl.BACKGROUND, chalkRgb(fore.r, fore.g, fore.b, cl.FOREGROUND, target));
        default: return target;
    }
}

function chalkViaColorMap(match, target, colorsMap, replaceGlobal = true) {
    function fixPattern(pattern) {
        return _.isString(pattern) ? pattern.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1') : pattern;
    }
    if (!match || !_.isString(match) || !target || !_.isString(target) || !_.isObject(colorsMap)) return target;
    const cleanMatch = match.replace(/[^A-Z]/g, '');
    const colorMap = _.find(colorsMap, { match: cleanMatch });
    if (!colorMap || !colorMap.style) return target;
    const flags = replaceGlobal ? 'g' : '';
    const re = new RegExp(fixPattern(match), flags);
    if (!target.match(re)) return target;
    return target.replace(re, chalkTarget(cleanMatch, colorMap.style));
}

module.exports = {
    chalkAnsi,
    chalkDatabaseOperation,
    chalkDatabaseOperations,
    chalkHex,
    chalkHttpStatuses,
    chalkHttpVerb,
    chalkHttpVerbs,
    chalkLogLevel,
    chalkMatch,
    chalkRgb,
    chalkTarget,
    chalkViaColorMap,
};
