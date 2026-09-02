// Copyright (c) 2026 by Beardon Services, Inc.

const _ = require('lodash');
const { DateTime } = require('luxon');
const SequelizeSimpleCache = require('sequelize-simple-cache');

const ONE_MINUTE = 60;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

const cacheTtls = {
    ONE_DAY,
    ONE_HOUR,
    ONE_MINUTE,
};

async function clearCache(cache) {
    if (!isCache(cache)) return false;
    return cache.clear();
}

function isCache(cache) {
    return (cache instanceof SequelizeSimpleCache);
}

function listCache(cache) {
    if (!isCache(cache)) return [ ];
    const models = [ ];
    for (const model in cache.cache) {
        const map = cache.cache[ model ];
        let expires = null;
        _.forEach(map, (value) => {
            const luxonExpires = DateTime.fromMillis(value.expires);
            expires = (_.isObject(luxonExpires) && luxonExpires.isValid) ? luxonExpires.toJSDate() : null;
        });
        models.push({ model, ttl: cache.config[ model ].ttl, expires });
    }
    return models;
}

module.exports = {
    cacheTtls,
    clearCache,
    listCache,
};
