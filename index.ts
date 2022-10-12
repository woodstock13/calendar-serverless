import { fastify } from 'fastify';
import { CreatePlekEventInputsType } from './models/calendar.model';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { CalendarG } from './services/calendar.service';
import * as dotenv from 'dotenv';
dotenv.config();

const server = fastify({ logger: true })
	.withTypeProvider<TypeBoxTypeProvider>()
	.register(require('@fastify/middie'), { hook: 'onRequest' })

const isApiKeyMatching = (keyInput: string) => process.env.X_API_KEY_VALUE === keyInput

// Registered Routes
server.get('/', async () => {
	return { hello: 'Welcome to calendar pleker API' };
});

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
server.post<{ Body: CreatePlekEventInputsType }>(
	'/calendar/add-event',
	async (request, reply) => {
		await calendar.createEvent(request.body);
		return JSON.stringify('todo');
	});
// server.register(calendarRoutes); // todo

const start = async () => {
	try {
		// MIDDLWARE
		server.addHook('onRequest', async (req, reply) => {
			if (req.routerPath !== '/') {
				const inputKey = req.headers['x-api-key'] as string
				console.log(req.routerPath);

				if (!isApiKeyMatching(inputKey) ?? true) {
					reply.status(401).send('Unauthorized')
				}
			}
		})
		server.addHook('onSend', async (req, reply) => {
			reply.header('Content-Type', 'application/json');
			reply.header('charset', 'utf-8');
		})
		await server.listen({ port: 3000 });
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};
start();
