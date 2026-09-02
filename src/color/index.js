// Copyright (c) 2026 by Beardon Services, Inc.

const { hslToHex, stringToIdempotentHexColor, stringToIdempotentHslValues } = require('./colors');

module.exports = {
    hslToHex,
    stringToIdempotentHexColor,
    stringToIdempotentHslValues,
    colors: { hslToHex, stringToIdempotentHexColor, stringToIdempotentHslValues },
};
