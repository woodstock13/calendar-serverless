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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = require("fastify");
const calendar_service_1 = require("./services/calendar.service");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const server = fastify_1.fastify({ logger: true })
    .withTypeProvider()
    .register(require('@fastify/middie'), { hook: 'onRequest' });
const isApiKeyMatching = (keyInput) => process.env.X_API_KEY_VALUE === keyInput;
// Registered Routes
server.get('/', () => __awaiter(void 0, void 0, void 0, function* () {
    return { hello: 'Welcome to calendar pleker API' };
}));
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
    yield calendar.createEvent(request.body);
    return JSON.stringify('todo');
}));
// server.register(calendarRoutes); // todo
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // MIDDLWARE
        server.addHook('onRequest', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            if (req.routerPath !== '/') {
                const inputKey = req.headers['x-api-key'];
                console.log(req.routerPath);
                if (_a = !isApiKeyMatching(inputKey), (_a !== null && _a !== void 0 ? _a : true)) {
                    reply.status(401).send('Unauthorized');
                }
            }
        }));
        yield server.listen({ port: 3000 });
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
});
start();
