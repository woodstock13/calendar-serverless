import { DateTime } from 'luxon';

export function IsoStringToShortFrDate(input_date) {
	return DateTime.fromISO(input_date).setLocale('fr').toLocaleString(DateTime.DATE_SHORT);
}

export function shortFrDateToDateTimeObject(fr_date) {
	const split_date = fr_date.toString().split('/');
	return DateTime.fromObject({
		day: split_date[0],
		month: split_date[1],
		year: split_date[2],
	});
}

export const checkDaysDiff = (end_fr_short_formatted, start_iso_format) => {
	const start = DateTime.fromISO(start_iso_format);
	const end = shortFrDateToDateTimeObject(end_fr_short_formatted);

	return end.diff(start, 'days').toObject().days;
};
