'use strict';
import { calendar_v3, google } from 'googleapis';
import { DateTime } from 'luxon';
import {
	checkDaysDiff,
	IsoStringToShortFrDate,
	shortFrDateToDateTimeObject,
} from '../common/utils';
import * as dotenv from 'dotenv';
import Calendar = calendar_v3.Calendar;
dotenv.config();

const GOOGLE_CALENDAR_ID = process.env.CALENDAR_ID;

interface DayAvailabilities {
	availibilties: number
	totalBookedPleks: number
	plekersEmail: string[]
}

// TODO RAF:
// x) handle event cache
export class CalendarG {
	calendar_instance: Calendar | undefined
	NUMBER_OF_DAYS_FROM_NOW = 15;

	// test_events set once at the CalendarG Init
	constructor() {
		if (!this.calendar_instance) {
			this.initCalendarInstance()
		} else {
			console.log(`Calendar already init :)`);
		}
	}

	async getCurrentEvents() {
		return this.getEventsListFromCalendar()
	}

	private initCalendarInstance(): void {
		const GOOGLE_PRIVATE_KEY = process.env.PRIVATE_KEY?.replace(/\\n/g, '\n');
		const GOOGLE_CLIENT_EMAIL = process.env.CLIENT_EMAIL;
		const GOOGLE_PROJECT_NUMBER = process.env.PROJECT_NUMBER;
		const SUBJECT_EMAIL = process.env.SUBJECT_EMAIL;
		const SCOPES = ['https://www.googleapis.com/auth/calendar'];

		const jwtClient = new google.auth.JWT(
			GOOGLE_CLIENT_EMAIL,
			undefined,
			GOOGLE_PRIVATE_KEY,
			SCOPES,
			SUBJECT_EMAIL
		);
		// @ts-ignore
		this.calendar_instance = google.calendar({
			version: 'v3',
			project: GOOGLE_PROJECT_NUMBER,
			auth: jwtClient,
		});
		// init events
		this.getEventsListFromCalendar().then();
	}

	public getEventsListFromCalendar = async () => {
		if (this.calendar_instance) {
			try {
				return (
					await this.calendar_instance.events.list({
						calendarId: process.env.CALENDAR_ID,
						timeMin: new Date().toISOString(),
						timeMax: DateTime.now().plus({ days: 15 }).setZone('Europe/Paris').toString(),
						maxResults: 100,
						singleEvents: true,
						orderBy: 'startTime',
					}))
					.data?.items
			} catch (err) {
				console.error('Something went wrong: ' + err);
				if (err) {
					throw new Error('No events');
				}
			}
		}
	};

	/**
	 * Return an Overview availabilities by pleker + the Set of dates.
	 */
	public plekersAvailabilityMapping = async () => {
		const events = await this.getCurrentEvents()
		if (events === null) {
			console.error('Something went wrong: pleker_availability_day_mapping()');
			throw new Error('No events');
		}

		const plekerMapping = new Map();
		const availableDays = new Set();

		if (events) {
			// @ts-ignore
			events.forEach((event: any) => {
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
		}

		return Object.fromEntries(plekerMapping);
		// return events;
	};


	/**
	 * Return availabilities by a Set of dates.
	 *
	 * @return Days_availability_mapped object Map<day:string
	 * {availabilities: [string], pleks: [string], plekers: [string]}>
	 */
	public daysAvailabilityMapping = async () => {
		const events = await this.getCurrentEvents()

		if (events === null) {
			console.error('Something went wrong: days_availability_mapping()');
			throw new Error('No events');
		}

		const daysCounter = new Map<string, DayAvailabilities>();
		if (events) {
			// @ts-ignore
			events.forEach((event: any) => {
				const isPlekType = event.status !== 'confirmed' || event.summary === 'PLEK';
				// const plekerId = event.attendees[0]?.email ?? event.creator.email;
				const plekerId = event.creator.email;

				const startDate = event.start.dateTime || event.start.date;
				const event_day = DateTime.fromISO(startDate)
					.setLocale('fr')
					.toLocaleString(DateTime.DATE_SHORT);
				const day_elements = daysCounter.get(event_day);

				const updatingAvailabilities = () => {
					const is_pleker_already_counted_this_day = day_elements?.plekersEmail.includes(plekerId);
					let updated_data_day: DayAvailabilities;

					if (day_elements) {
						if (isPlekType) {
							updated_data_day = {
								availibilties: day_elements.availibilties,
								totalBookedPleks: day_elements.totalBookedPleks + 1,
								plekersEmail: [...day_elements.plekersEmail],
							};
						} else {
							updated_data_day = {
								availibilties: day_elements.availibilties + 1,
								totalBookedPleks: day_elements.totalBookedPleks,
								plekersEmail: is_pleker_already_counted_this_day
									? [...day_elements.plekersEmail]
									: [...day_elements.plekersEmail, plekerId],
							};
						}
						daysCounter.set(event_day, updated_data_day);
					}
				}
				const creatingDayRecord = () => {
					daysCounter.set(event_day, {
						availibilties: isPlekType ? 0 : 1,
						totalBookedPleks: isPlekType ? 1 : 0,
						plekersEmail: [plekerId],
					});
				}
				day_elements ? updatingAvailabilities() : creatingDayRecord();
			});
		}
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
	getClosestDaysFrom(selected_date_iso_format: string, available_days_mapping: Map<any, any>) {
		const selected_date_fr_format = IsoStringToShortFrDate(selected_date_iso_format);

		let flag = false;
		let min_diff_value = 365;
		let min_date = selected_date_fr_format;

		available_days_mapping.forEach((value, key_date) => {
			if (value.pleks < value.availabilities) {
				if (!flag) {
					if (key_date !== selected_date_fr_format) {
						const diff = Math.abs(checkDaysDiff(key_date, selected_date_iso_format) as number);
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
		return shortFrDateToDateTimeObject(min_date);
	}

	getNextDaysAvailable(available_days_mapping: Map<string, DayAvailabilities>): string[] {
		const daysAvailable: string[] = [];
		available_days_mapping.forEach((value: DayAvailabilities, date: string) => {
			if (value.totalBookedPleks < value.availibilties) {
				daysAvailable.push(shortFrDateToDateTimeObject(date).toISO());
			}
		});
		return daysAvailable;
	}

	/* input: plekId, plekerId, start_date_iso_plek, end_date_iso_plek, location ...*/
	// add a *subject* is required
	createEvent = async () => {
		const calendarEvent = {
			summary: 'PLEK',
			status: 'tentative',
			description: 'plekId, tasks and all are going here',
			// location: 'location to add here', // could be add here but need to be sure of the visibility
			// visibility: 'private', // not sure if service can see it
			start: {
				dateTime: '2022-10-08T18:18:00Z',
				timeZone: 'Europe/Paris',
			},
			end: {
				dateTime: '2022-10-08T19:19:00Z',
				timeZone: 'Europe/Paris',
			},
			attendees: [{ email: 'pleker@mail.com' }],
		};
		try {
			const res = (
				// @ts-ignore
				(await this.calendar_instance?.events.insert({
					calendarId: GOOGLE_CALENDAR_ID,
					resource: calendarEvent,
				})).data
			)
			console.log(res);
		} catch (err) {
			console.error('Something went wrong: ' + err);
			if (err) {
				throw new Error('No events');
			}
		}
	};
}
