import { fastify } from 'fastify';
// @ts-ignore
import { CalendarG } from './services/calendar.service';

const server = fastify({
	logger: true,
});

// TODO
/**
 * middleware protection for call - x-api-secret
 * logic service + front integration
 */

// Registered Routes
// server.register(calendarRoutes); // todo

const calendar = new CalendarG();
server.get('/calendar/events', async () => {
	return JSON.stringify(await calendar.getCurrentEvents());
});
server.get('/calendar/plekers-availabilities', async () => {
	return JSON.stringify(await calendar.plekersAvailabilityMapping());
});
server.get('/calendar/days-availabilities', async () => {
	const availabilities_map = await calendar.daysAvailabilityMapping();
	const availabilities = Object.fromEntries(availabilities_map);
	return JSON.stringify(availabilities);
});
// deprecated for now
// server.get('/calendar/next-availability-from/:date', async (request, reply) => {
// 	// @ts-ignore
// 	const { date } = request.params;

// 	const availabilities_map = await calendar.daysAvailabilityMapping();
// 	const closest_date = calendar.getClosestDaysFrom(date, availabilities_map);

// 	return JSON.stringify({ closest_day_fr_short_date: closest_date });
// });
server.get('/calendar/next-availabilities', async () => {
	const availabilities_map = await calendar.daysAvailabilityMapping();
	const dates = calendar.getNextDaysAvailable(availabilities_map);

	return JSON.stringify({ days: dates });
});
server.post('/calendar/add-event', async (request, reply) => {
	await calendar.createEvent();
	return JSON.stringify('todo');
});

server.get('/', async () => {
	return { hello: 'Welcome to calendar pleker API' };
});

/**
 * Run the server!
 */
const start = async () => {
	try {
		await server.listen({ port: 3000 });
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};
start();
