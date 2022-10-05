import { CalendarG } from '../services/calendar.service.mjs';

export default async function calendarRoutes(fastify, options) {
	const calendar = new CalendarG();
	fastify.get('/calendar/events', async (request, reply) => {
		return JSON.stringify(calendar.test_events);
	});
	fastify.get('/calendar/plekers-availabilities', async (request, reply) => {
		return JSON.stringify(await calendar.plekersAvailabilityMapping());
	});
	fastify.get('/calendar/days-availabilities', async (request, reply) => {
		const availabilities_map = await calendar.daysAvailabilityMapping();
		const availabilities = Object.fromEntries(availabilities_map);
		return JSON.stringify(availabilities);
	});
	fastify.get('/calendar/next-availability-from/:date', async (request, reply) => {
		const { date } = request.params;

		const availabilities_map = await calendar.daysAvailabilityMapping();
		const closest_date = calendar.getClosestDaysFrom(date, availabilities_map);

		return JSON.stringify({ closest_day_fr_short_date: closest_date });
	});
	fastify.get('/calendar/next-availabilities', async (request, reply) => {
		const availabilities_map = await calendar.daysAvailabilityMapping();
		const dates = calendar.getNextDaysAvailable(availabilities_map);

		return JSON.stringify({ days: dates });
	});
	fastify.post('/calendar/add-event', async (request, reply) => {
		await calendar.createEvent();
		return JSON.stringify('todo');
	});
}
