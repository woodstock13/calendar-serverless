const { google } = require('googleapis');
require('dotenv').config();

//TODO: setup fastifu sample + push vercel And do calendar logic bt endpoint

const GOOGLE_PRIVATE_KEY = process.env.PRIVATE_KEY;
const GOOGLE_CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const GOOGLE_PROJECT_NUMBER = process.env.PROJECT_NUMBER;
const GOOGLE_CALENDAR_ID = process.env.CALENDAR_ID;

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const jwtClient = new google.auth.JWT(GOOGLE_CLIENT_EMAIL, null, GOOGLE_PRIVATE_KEY, SCOPES);

const calendar = google.calendar({
	version: 'v3',
	project: GOOGLE_PROJECT_NUMBER,
	auth: jwtClient,
});

// end init calendar api

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

const addCalendarEvent = async () => {
	calendar.events.list(
		{
			calendarId: GOOGLE_CALENDAR_ID,
			timeMin: new Date().toISOString(),
			maxResults: 10,
			singleEvents: true,
			orderBy: 'startTime',
		},
		function (err, response) {
			if (err) {
				console.dir(err);
				console.error('Something went wrong: ' + err); // If there is an error, log it to the console
				return;
			}
			console.log('Event created successfully.');
			console.log('Event details: ', response.data); // Log the event details
		}
	);
};

addCalendarEvent();
