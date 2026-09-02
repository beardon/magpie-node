// Copyright (c) 2024-2026 by Beardon Services, Inc.

const _ = require('lodash');
const { DateTime } = require('luxon');

const enums = require('../enums.js');
const { durationUnits: du } = enums;

function calculateExpiry(effectiveDate, duration, durationUnit) {
    const effectiveDateLuxon = dateToLuxon(effectiveDate);
    if (!effectiveDateLuxon) return null;
    if (!_.isInteger(duration) || duration <= 0) return null;
    let expiresOnLuxon = null;
    switch (durationUnit) {
        case du.DAY:
            expiresOnLuxon = effectiveDateLuxon.plus({ days: duration });
            break;
        case du.MONTH:
            expiresOnLuxon = effectiveDateLuxon.plus({ months: duration });
            break;
        case du.YEAR:
            expiresOnLuxon = effectiveDateLuxon.plus({ years: duration });
            break;
        default:
            return null;
    }
    return expiresOnLuxon.toSQLDate();
}

function convertMilliseconds(milliseconds, options) {
    options = options || { };
    const digits = options.digits || 3;
    const spaced = options.hasOwnProperty('spaced') ? options.spaced : false;
    let value = milliseconds || 0;
    let unit = 'ms';
    if (milliseconds) {
        const seconds = milliseconds / 1000;
        if (seconds >= 1) {
            value = seconds;
            unit = 's';
            const minutes = seconds / 60;
            if (minutes >= 1) {
                value = minutes;
                unit = 'm';
                const hours = minutes / 60;
                if (hours >= 1) {
                    value = hours;
                    unit = 'h';
                    const days = hours / 24;
                    if (days >= 1) {
                        value = days;
                        unit = 'd';
                        const weeks = days / 7;
                        if (weeks >= 1) {
                            value = weeks;
                            unit = 'w';
                            const months = days / 30;
                            if (months >= 1) {
                                value = months;
                                unit = 'M';
                                const years = days / 365;
                                if (years >= 1) {
                                    value = years;
                                    unit = 'y';
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return `${ value.toFixed(digits) }${ spaced ? ' ' : '' }${ unit }`;
}

/**
 * Converts a SQL date and time string to a Luxon DateTime object.
 * @param {String} date
 * @param {String} time
 * @returns {DateTime|null}
 */
function dateAndTimeToLuxon(date, time) {
    if (!date || !time) return null;
    const luxonDate = dateOnlyToLuxon(date);
    if (!luxonDate) return null;
    let luxonTime = DateTime.fromFormat(time, 'H:mm');
    if (!luxonTime.isValid) luxonTime = DateTime.fromFormat(time, 'H:mm:ss');
    if (!luxonTime.isValid) return null;
    return luxonDate.set({ hour: luxonTime.hour, minute: luxonTime.minute });
}

/**
 * Converts a SQL date-only string to a Luxon DateTime object.
 * @param {String} date
 * @param {Boolean} usePassiveTimezone
 * @param {String} timezone
 * @returns {DateTime|null}
 */
function dateOnlyToLuxon(date, usePassiveTimezone = false, timezone = config.get('databases.defaults.timezone')) {
    if (!date) return null;
    const luxonDate = DateTime.fromSQL(date);
    if (!luxonDate.isValid) return null;
    return usePassiveTimezone ? forceLuxonDateToTimezone(luxonDate, timezone) : luxonDate;
}

/**
 * Converts a JavaScript Date object to a Luxon DateTime object.
 * @param {Date|DateTime|string} datetime
 * @param {Boolean} usePassiveTimezone
 * @param {String} timezone
 * @returns {DateTime|null}
 */
function datetimeToLuxon(datetime, usePassiveTimezone = false, timezone = config.get('databases.defaults.timezone')) {
    if (!datetime) return null;
    let luxonDatetime = DateTime.fromJSDate(datetime);
    if (!luxonDatetime.isValid) luxonDatetime = DateTime.fromISO(datetime);
    if (!luxonDatetime.isValid) return null;
    return usePassiveTimezone ? forceLuxonDateToTimezone(luxonDatetime, timezone) : luxonDatetime;
}

function dateToFormat(date, format) {
    const luxonDate = dateToLuxon(date);
    return luxonDate ? luxonDate.toFormat(format) : date;
}

/**
 * Converts a JavaScript date or a SQL date-only string to a Google Calendar date string.
 * @param {Date|String} date
 * @returns {String|null}
 */
function dateToGoogleCalendar(date) {
    const luxonDate = dateToLuxon(date, true);
    if (!luxonDate || !luxonDate.isValid) return null;
    const googleDate = luxonDate.toFormat('yyyyMMdd');
    const googleTime = luxonDate.toFormat('HHmmss');
    return `${ googleDate }T${ googleTime }`;
}

/**
 * Converts a JavaScript date or a SQL date-only string to a Luxon DateTime object.
 * @param {DateTime|String} date
 * @param {Boolean} usePassiveTimezone
 * @param {String} timezone
 * @returns {DateTime|null}
 */
function dateToLuxon(date, usePassiveTimezone = false, timezone = config.get('databases.defaults.timezone')) {
    let luxonDate = datetimeToLuxon(date, usePassiveTimezone, timezone);
    if (!luxonDate) luxonDate = dateOnlyToLuxon(date, usePassiveTimezone, timezone);
    return (luxonDate && luxonDate.isValid) ? luxonDate : null;
}

/**
 * Determines if JavaScript date ranges overlap.
 * @link https://stackoverflow.com/a/50813527/1083896
 * @param {Array<Array<Date,Date>>} startEndDates
 * @returns {Object<Boolean,Array<String>>}
 */
function doDateRangesOverlap(startEndDates) {
    function allPairs(xs) {
        return xs.reduce((acc, x, i) => acc.concat(xs.slice(i + 1).map(y => [ x, y ])), [ ]);
    }
    if (!startEndDates || !Array.isArray(startEndDates) || (startEndDates.length < 1)) return false;
    for (const startEndDate of startEndDates) {
        if (!Array.isArray(startEndDate) || (startEndDate.length !== 2)) return false;
    }
    const pairs = allPairs(startEndDates);
    let anyOverlap = false;
    const reasons = [ ];
    for (const pair of pairs) {
        const [ [ aStart, aEnd ], [ bStart, bEnd ] ] = pair;
        const { overlap, reason } = doesDateRangeOverlap(aStart, aEnd, bStart, bEnd);
        if (overlap) {
            anyOverlap = true;
            reasons.push(reason);
        }
    }
    return { overlap: anyOverlap, reasons };
}

/**
 * Determines if two JavaScript date ranges overlap.
 * @link https://stackoverflow.com/a/50822701/1083896
 * @param {Date} aStart
 * @param {Date} aEnd
 * @param {Date} bStart
 * @param {Date} bEnd
 * @returns {Object<Boolean,String>}
 */
function doesDateRangeOverlap(aStart, aEnd, bStart, bEnd) {
    function formatDate(date) {
        return dateToFormat(date, 'M/d/yyyy h:mm a');
    }
    let overlap = false;
    let reason = '';
    if (aStart <= bStart && bStart <= aEnd) {
        overlap = true;
        reason = `${ formatDate(bStart) } is between ${ formatDate(aStart) } and ${ formatDate(aEnd) }`;
    }
    if (!overlap && (aStart <= bEnd && bEnd <= aEnd)) {
        overlap = true;
        reason = `${ formatDate(bEnd) } is between ${ formatDate(aStart) } and ${ formatDate(aEnd) }`;
    }
    if (!overlap && (bStart < aStart && aEnd < bEnd)) {
        overlap = true;
        reason = `${ formatDate(aStart) } and ${ formatDate(aEnd) } is within ${ formatDate(bStart) } and ${ formatDate(bEnd) }`;
    }
    return { overlap, reason };
}

/**
 * Returns the end of the fiscal year for the given date.
 * @param {Date} targetDate
 * @returns {Date}
 */
function fiscalYearEnd(targetDate) {
    const then = DateTime.fromJSDate(targetDate);
    const year = (then.month > 7) ? (then.year + 1) : then.year;
    return DateTime.fromObject({ year, month: 6, day: 30 }).toJSDate();
}

/**
 * Returns the start of the fiscal year for the given date.
 * @param {Date} targetDate
 * @returns {Date}
 */
function fiscalYearStart(targetDate) {
    const then = DateTime.fromJSDate(targetDate);
    const year = (then.month < 7) ? (then.year - 1) : then.year;
    return DateTime.fromObject({ year, month: 7, day: 1 }).toJSDate();
}

/**
 * Forces a Luxon DateTime object to a specific timezone.
 * @param {DateTime} luxonDate
 * @param {String} timezone
 * @returns {DateTime|null}
 */
function forceLuxonDateToTimezone(luxonDate, timezone = config.get('databases.defaults.timezone')) {
    if (!luxonDate.isValid) return null;
    return luxonDate.toUTC().setZone(timezone, { keepLocalTime: true });
}

/**
 * Converts a JavaScript date to a relative time string.
 * @param {Date} datetime
 * @returns {*|string}
 */
function fromNow(datetime) {
    const datetimeLuxon = DateTime.fromJSDate(datetime);
    if (!datetimeLuxon.isValid) return datetime;
    const relativeTime = datetimeLuxon.toRelative()
    if ((relativeTime === 'in 0 seconds') || (relativeTime === '0 seconds ago')) return 'just now';
    return relativeTime;
}

function isValidDate(date) {
    return !!dateToLuxon(date);
}

/**
 * Tests various-format date strings for date validity.
 * @param {String} possibleDate
 * @param {String} luxonFormat
 * @param {String} zone
 * @returns {Boolean}
 */
function isStringDate(possibleDate, luxonFormat = 'yyyy-MM-dd', zone = 'utc') {
    const luxonDate = parseDateToLuxonDateTime(possibleDate, luxonFormat, zone);
    return (luxonDate && luxonDate.isValid);
}

/**
 * Parses various-format date strings into a specific format or JavaScript date.
 * @param {String} possibleDate
 * @param {String} luxonFormat
 * @param {String} zone
 * @returns {*|string|Date}
 */
function parseDateToLuxonDateTime(possibleDate, luxonFormat = 'yyyy-MM-dd', zone = 'utc') {
    const DAY_TOKEN = '%d';
    const MONTH_TOKEN = '%m';
    const POSSIBLE_DAY_FORMATS = [ 'd', 'dd' ];
    const POSSIBLE_FORMATS = [ '%m/%d/%y', '%m-%d-%y', '%y-%m-%d' ];
    const POSSIBLE_MONTH_FORMATS = [ 'M', 'MM' ];
    const POSSIBLE_YEAR_FORMATS = [ 'yyyy', 'yy' ];
    const YEAR_TOKEN = '%y';
    const cleanDate = possibleDate.replace(/[^0-9-\/]/g, '');
    for (const possibleYearFormat of POSSIBLE_YEAR_FORMATS) {
        for (const possibleMonthFormat of POSSIBLE_MONTH_FORMATS) {
            for (const possibleDayFormat of POSSIBLE_DAY_FORMATS) {
                for (const possibleFormat of POSSIBLE_FORMATS) {
                    const format = possibleFormat.replace(YEAR_TOKEN, possibleYearFormat).replace(MONTH_TOKEN, possibleMonthFormat).replace(DAY_TOKEN, possibleDayFormat);
                    const luxonDate = DateTime.fromFormat(cleanDate, format, { zone });
                    if (luxonDate.isValid) return luxonDate;
                }
            }
        }
    }
    return null;
}

/**
 * Parses various-format date strings into a specific format or JavaScript date.
 * @param {String} possibleDate
 * @param {String} luxonFormat
 * @param {String} zone
 * @returns {*|string|Date}
 */
function parseDateToString(possibleDate, luxonFormat = 'yyyy-MM-dd', zone = 'utc') {
    const luxonDate = parseDateToLuxonDateTime(possibleDate, luxonFormat, zone);
    if (luxonDate && luxonDate.isValid) return luxonFormat ? luxonDate.toFormat(luxonFormat) : luxonDate.toJSDate();
    return possibleDate;
}

module.exports = {
    calculateExpiry,
    convertMilliseconds,
    dateAndTimeToLuxon,
    dateOnlyToLuxon,
    datetimeToLuxon,
    dateToFormat,
    dateToGoogleCalendar,
    dateToLuxon,
    doDateRangesOverlap,
    doesDateRangeOverlap,
    fiscalYearEnd,
    fiscalYearStart,
    forceLuxonDateToTimezone,
    fromNow,
    isStringDate,
    isValidDate,
    parseDateToLuxonDateTime,
    parseDateToString,
};
