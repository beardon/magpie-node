// Copyright (c) 2024-2026 by Beardon Services, Inc.

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
    hslToHex,
    stringToIdempotentHexColor,
    stringToIdempotentHslValues,
};
