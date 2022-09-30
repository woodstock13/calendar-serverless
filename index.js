// CommonJs
const fastify = require('fastify')({
	logger: true,
});

fastify.get('/', async (request, reply) => {
	return { hello: 'world' };
});
fastify.get('/ping', async (request, reply) => {
	return { ping: 'pong' };
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
