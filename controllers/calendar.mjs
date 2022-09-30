'use strict';
import { google } from 'googleapis';
import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

// our-first-route.js

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
export default async function calendarRoutes(fastify, options) {
	fastify.get('/calendar/events', async (request, reply) => {
		const calendar = new CalendarG();
		const toto = await calendar.getEventsListFromCalendar();
		return JSON.stringify(toto);
	});
}

const GOOGLE_PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
const GOOGLE_CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const GOOGLE_PROJECT_NUMBER = process.env.PROJECT_NUMBER;
const GOOGLE_CALENDAR_ID = process.env.CALENDAR_ID;
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

class CalendarG {
	calendarInstance;

	constructor() {
		const jwtClient = new google.auth.JWT(GOOGLE_CLIENT_EMAIL, null, GOOGLE_PRIVATE_KEY, SCOPES);
		this.calendarInstance = google.calendar({
			version: 'v3',
			project: GOOGLE_PROJECT_NUMBER,
			auth: jwtClient,
		});
	}

	getEventsListFromCalendar = async () => {
		let res;
		// todo set timezone convert for fr
		try {
			res = (
				await this.calendarInstance.events.list({
					calendarId: GOOGLE_CALENDAR_ID,
					timeMin: new Date().toISOString(),
					maxResults: 100,
					singleEvents: true,
					orderBy: 'startTime',
				})
			).data;
		} catch (error) {
			if (err) {
				console.dir(err);
				console.error('Something went wrong: ' + err); // If there is an error, log it to the console
				return null;
			}
			console.log('Events loaded successfully.');
			console.log('Events details: ', response.data); // Log the event details
		}
		console.dir(res.items[0].creator.email); // Log the event details
		return res.items;
	};

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
