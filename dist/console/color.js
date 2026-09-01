// Copyright (c) 2024-2026 by Beardon Services, Inc.

const _ = require('lodash');
const chalk = require('chalk');

const colorMappings = require('./color_mappings');
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

function chalkLogLevel(logLevel, string = null) {
    return chalkMatch(logLevel, string, colorMappings.logLevelColors);
}

function chalkMatch(match, string, colorsMap) {
    if (!string) string = match;
    const colorMap = _.find(colorsMap, { match });
    if (!colorMap || !colorMap.style) return string;
    return chalkTarget(string, colorMap.style);
}

function chalkHttpVerb(verb, string = null) {
    return chalkMatch(verb, string, colorMappings.httpVerbColors);
}

function chalkHttpVerbs(verb, string = null, replaceGlobal = false) {
    if (!string) string = verb;
    return chalkViaColorMap(verb, string, colorMappings.httpVerbColors, replaceGlobal);
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

// adapted from https://stackoverflow.com/a/44134328
function hslToHex(hue, saturation, lightness) {
    lightness /= 100;
    const a = saturation * Math.min(lightness, 1 - lightness) / 100;
    const convert = (n) => {
        const k = (n + hue / 30) % 12;
        const color = lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0'); // convert to Hex and prefix "0" if needed
    };
    return `#${ convert(0) }${ convert(8) }${ convert(4) }`;
}

// adapted from https://gist.github.com/0x263b/2bdd90886c2036a1ad5bcf06d6e6fb37
function stringToIdempotentHexColor(str, useHsl = true) {
    if (useHsl) {
        const { h, s, l } = stringToIdempotentHslValues(str);
        return hslToHex(h, s, l);
    }
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    let hexColor = '#';
    for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 255;
        hexColor += (`00${ value.toString(16) }`).substring(-2);
    }
    return hexColor;
}

// adapted from https://gist.github.com/0x263b/2bdd90886c2036a1ad5bcf06d6e6fb37
function stringToIdempotentHslValues(str, hslOptions) {
    function range(hash, min, max) {
        const diff = max - min;
        const x = ((hash % diff) + diff) % diff;
        return x + min;
    }

    hslOptions = hslOptions || { };
    const hueRange = hslOptions.hue || [ 0, 360 ];
    const saturationRange = hslOptions.saturation || [ 75, 100 ];
    const lightnessRange = hslOptions.lightness || [ 40, 60 ];

    let hash = 0;
    if (!str || str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }

    const hue = range(hash, hueRange[ 0 ], hueRange[ 1 ]);
    const saturation = range(hash, saturationRange[ 0 ], saturationRange[ 1 ]);
    const lightness = range(hash, lightnessRange[ 0 ], lightnessRange[ 1 ]);

    return { h: hue, s: saturation, l: lightness };
}

module.exports = {
    chalkDatabaseOperations,
};
