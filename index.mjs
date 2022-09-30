import Fastify from 'fastify';
import calendarRoutes from './controllers/calendar.mjs';

const fastify = Fastify({
	logger: true,
});

// TODO
/**
 * middleware protection for call - x-api-secret
 * logic service + front integration
 */

fastify.get('/', async (request, reply) => {
	return { hello: 'world2' };
});
fastify.get('/ping', async (request, reply) => {
	return { ping: 'pong' };
});

// Registered Routes
fastify.register(calendarRoutes);

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
