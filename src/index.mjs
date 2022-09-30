import Fastify from 'fastify';
import CalendarG from './calendar.mjs';

const fastify = Fastify({
	logger: true,
});

// TODO
/**
 * middleware protection for call - x-api-secret
 * logic service + front integration
 */
fastify.get('/', async (request, reply) => {
	return { hello: 'world' };
});
fastify.get('/ping', async (request, reply) => {
	return { ping: 'pong' };
});

fastify.get('/calendar', async (request, reply) => {
	const calendar = new CalendarG();
	const toto = await calendar.getEventsListFromCalendar();
	return JSON.stringify(toto);
});

/**
 * Run the server!
 */
const start = async () => {
	try {
		await fastify.listen({ port: 3000 });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
start();
