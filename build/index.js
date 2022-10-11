"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = require("fastify");
// @ts-ignore
const calendar_service_1 = require("./services/calendar.service");
const server = (0, fastify_1.fastify)({
    logger: true,
});
// TODO
/**
 * middleware protection for call - x-api-secret
 * logic service + front integration
 */
// Registered Routes
// server.register(calendarRoutes); // todo
const calendar = new calendar_service_1.CalendarG();
server.get('/calendar/events', () => __awaiter(void 0, void 0, void 0, function* () {
    return JSON.stringify(yield calendar.getCurrentEvents());
}));
server.get('/calendar/plekers-availabilities', () => __awaiter(void 0, void 0, void 0, function* () {
    return JSON.stringify(yield calendar.plekersAvailabilityMapping());
}));
server.get('/calendar/days-availabilities', () => __awaiter(void 0, void 0, void 0, function* () {
    const availabilities_map = yield calendar.daysAvailabilityMapping();
    const availabilities = Object.fromEntries(availabilities_map);
    return JSON.stringify(availabilities);
}));
// deprecated for now
// server.get('/calendar/next-availability-from/:date', async (request, reply) => {
// 	// @ts-ignore
// 	const { date } = request.params;
// 	const availabilities_map = await calendar.daysAvailabilityMapping();
// 	const closest_date = calendar.getClosestDaysFrom(date, availabilities_map);
// 	return JSON.stringify({ closest_day_fr_short_date: closest_date });
// });
server.get('/calendar/next-availabilities', () => __awaiter(void 0, void 0, void 0, function* () {
    const availabilities_map = yield calendar.daysAvailabilityMapping();
    const dates = calendar.getNextDaysAvailable(availabilities_map);
    return JSON.stringify({ days: dates });
}));
server.post('/calendar/add-event', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    yield calendar.createEvent();
    return JSON.stringify('todo');
}));
server.get('/', () => __awaiter(void 0, void 0, void 0, function* () {
    return { hello: 'Welcome to calendar pleker API' };
}));
/**
 * Run the server!
 */
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield server.listen({ port: 3000 });
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
});
start();
