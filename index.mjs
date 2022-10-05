import Fastify from 'fastify';
import calendarRoutes from './controllers/calendar.controller.mjs';

const fastify = Fastify({
	logger: true,
});

// TODO
/**
 * middleware protection for call - x-api-secret
 * logic service + front integration
 */

// Registered Routes
fastify.register(calendarRoutes);
fastify.get('/', async (request, reply) => {
	return { hello: 'Welcome to calendar pleker API' };
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
