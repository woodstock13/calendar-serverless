"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
function IsoStringToShortFrDate(input_date) {
    return luxon_1.DateTime.fromISO(input_date).setLocale('fr').toLocaleString(luxon_1.DateTime.DATE_SHORT);
}
exports.IsoStringToShortFrDate = IsoStringToShortFrDate;
function shortFrDateToDateTimeObject(fr_date) {
    const split_date = fr_date.toString().split('/');
    return luxon_1.DateTime.fromObject({
        day: Number(split_date[0]),
        month: Number(split_date[1]),
        year: Number(split_date[2]),
    });
}
exports.shortFrDateToDateTimeObject = shortFrDateToDateTimeObject;
exports.checkDaysDiff = (end_fr_short_formatted, start_iso_format) => {
    const start = luxon_1.DateTime.fromISO(start_iso_format);
    const end = shortFrDateToDateTimeObject(end_fr_short_formatted);
    return end.diff(start, 'days').toObject().days;
};
