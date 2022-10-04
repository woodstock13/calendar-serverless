'use strict';
import { google } from 'googleapis';
import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import { DateTime } from 'luxon';
import { IsoStringToShortFrDate, checkDaysDiff } from '../common/utils.mjs';

export default async function calendarRoutes(fastify, options) {
	const calendar = new CalendarG();

	fastify.get('/calendar/events', async (request, reply) => {
		return JSON.stringify(calendar.test_events);
	});
	fastify.get('/calendar/availabilities', async (request, reply) => {
		return JSON.stringify(await calendar.pleker_availability_day_mapping());
	});
	fastify.get('/calendar/compute', async (request, reply) => {
		const availabilities_map = await calendar.days_availability_mapping();
		const availabilities = Object.fromEntries(availabilities_map);
		return JSON.stringify(availabilities);
	});
	fastify.get('/calendar/next-availability-from/:date', async (request, reply) => {
		const { date } = request.params;

		const availabilities_map = await calendar.days_availability_mapping();
		const closest_date = calendar.get_closest_days_from(date, availabilities_map);

		return JSON.stringify(closest_date);
	});
}

// TODO RAF:
// change to TS
// decouper le service

// service
const GOOGLE_PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
const GOOGLE_CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const GOOGLE_PROJECT_NUMBER = process.env.PROJECT_NUMBER;
const GOOGLE_CALENDAR_ID = process.env.CALENDAR_ID;
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export class CalendarG {
	test_events = null; // todo: setter / getter

	// test_events set once at the CalendarG Init
	constructor() {
		if (CalendarG._calendarInstance) {
			CalendarG._calendarInstance;
		} else {
			this.initCalendarInstance();
		}
	}
	initCalendarInstance() {
		const jwtClient = new google.auth.JWT(GOOGLE_CLIENT_EMAIL, null, GOOGLE_PRIVATE_KEY, SCOPES);
		CalendarG._calendarInstance = google.calendar({
			version: 'v3',
			project: GOOGLE_PROJECT_NUMBER,
			auth: jwtClient,
		});
		// init events
		this.getEventsListFromCalendar().then();
	}

	getEventsListFromCalendar = async () => {
		try {
			const res = (
				await CalendarG._calendarInstance.events.list({
					calendarId: GOOGLE_CALENDAR_ID,
					timeMin: new Date().toISOString(),
					maxResults: 100,
					singleEvents: true,
					orderBy: 'startTime',
				})
			).data;
			this.test_events = res.items;
			return this.test_events;
		} catch (error) {
			console.error('Something went wrong: ' + err); // If there is an error, log it to the console
			return null;
		}
	};

	/**
	 * Return an Overview availabilities by pleker + the Set of dates.
	 */
	pleker_availability_day_mapping = async () => {
		const events = this.test_events || (await this.getEventsListFromCalendar());
		const plekerMapping = new Map();
		const availableDays = new Set();

		events.forEach((event) => {
			// check name event ? for pleker
			const plekerId = event.creator.email;
			const startDate = event.start.dateTime || event.start.date;

			if (!plekerMapping.get(plekerId)) {
				plekerMapping.set(plekerId, { availability_dates: [startDate] }); // perform UTC change
			} else {
				// pleker already exist
				const current_dates = plekerMapping.get(plekerId).availability_dates;
				plekerMapping.set(plekerId, { availability_dates: [startDate, ...current_dates] });
			}
			const dt = DateTime.fromISO(startDate).setLocale('fr');
			availableDays.add(dt.toLocaleString(DateTime.DATE_SHORT));
		});
		plekerMapping.set('days', [...availableDays]);
		return Object.fromEntries(plekerMapping);
		// return events;
	};

	/**
	 * Return availabilities by a Set of dates.
	 *
	 * @return Days_availability_mapped object Map<day:string {availabilities: [string], pleks: [string], plekers: [string]}>
	 */
	days_availability_mapping = async () => {
		const events = this.test_events || (await this.getEventsListFromCalendar());
		// check if events ?
		const daysCounter = new Map();

		events.forEach((event) => {
			const isPlekType = event.status !== 'confirmed' || event.summary === 'PLEK';
			const plekerId = event.creator.email;

			const startDate = event.start.dateTime || event.start.date;
			const event_day = DateTime.fromISO(startDate)
				.setLocale('fr')
				.toLocaleString(DateTime.DATE_SHORT);
			const day_elements = daysCounter.get(event_day);

			const updatingAvailabilities = () => {
				const is_pleker_already_counted_this_day = day_elements.plekers.includes(plekerId);
				let updated_data_day = null;

				if (isPlekType) {
					updated_data_day = {
						availabilities: day_elements.availabilities,
						pleks: day_elements.pleks + 1,
						plekers: [...day_elements.plekers] || [],
					};
				} else {
					updated_data_day = {
						availabilities: day_elements.availabilities + 1,
						pleks: day_elements.pleks,
						plekers: is_pleker_already_counted_this_day
							? [...day_elements.plekers]
							: [...day_elements.plekers, plekerId],
					};
				}
				daysCounter.set(event_day, updated_data_day);
			};
			const creatingDayRecord = () => {
				daysCounter.set(event_day, {
					availabilities: isPlekType ? 0 : 1,
					pleks: isPlekType ? 1 : 0,
					plekers: [plekerId],
				});
			};
			day_elements ? updatingAvailabilities() : creatingDayRecord();
		});
		return daysCounter;
	};

	// todo :
	// 2) write test
	// 3) alert no events email;
	/**
	 *  @param(selected_date_iso_format) incoming string iso date
	 *  @param(available_days_mapping) Map of available days
	 *
	 *  @return the same or the closest date available as string
	 */
	get_closest_days_from(selected_date_iso_format, available_days_mapping) {
		const selected_date_fr_format = IsoStringToShortFrDate(selected_date_iso_format);

		let flag = false;
		let min_diff_value = 365;
		let min_date = selected_date_fr_format;

		available_days_mapping.forEach((value, key_date) => {
			if (value.pleks < value.availabilities) {
				if (!flag) {
					if (key_date !== selected_date_fr_format) {
						let diff = Math.abs(checkDaysDiff(key_date, selected_date_iso_format));
						if (diff < min_diff_value) {
							min_diff_value = diff;
							min_date = key_date;
						}
					} else {
						min_date = selected_date_fr_format;
						flag = true;
					}
				}
			}
		});
		return min_date;
	}

	// todo
	createEvent = () => {
		var calendarEvent = {
			summary: 'Test Event added by Node.js',
			description: 'This event was created by Node.js',
			start: {
				dateTime: '2022-06-03T09:00:00-02:00',
				timeZone: 'Asia/Kolkata',
			},
			end: {
				dateTime: '2022-06-04T17:00:00-02:00',
				timeZone: 'Asia/Kolkata',
			},
			attendees: [],
			reminders: {
				useDefault: false,
				overrides: [
					{ method: 'email', minutes: 24 * 60 },
					{ method: 'popup', minutes: 10 },
				],
			},
		};
	};
}
