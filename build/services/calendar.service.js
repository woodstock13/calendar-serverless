'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.CalendarG = void 0;
const googleapis_1 = require("googleapis");
const luxon_1 = require("luxon");
const utils_1 = require("../common/utils");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const GOOGLE_CALENDAR_ID = process.env.CALENDAR_ID;
// TODO RAF:
// x) handle event cache
class CalendarG {
    // test_events set once at the CalendarG Init
    constructor() {
        this.NUMBER_OF_DAYS_FROM_NOW = 15;
        this.getEventsListFromCalendar = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.calendar_instance) {
                try {
                    return (_a = (yield this.calendar_instance.events.list({
                        calendarId: process.env.CALENDAR_ID,
                        timeMin: new Date().toISOString(),
                        timeMax: luxon_1.DateTime.now().plus({ days: 15 }).setZone('Europe/Paris').toString(),
                        maxResults: 100,
                        singleEvents: true,
                        orderBy: 'startTime',
                    }))
                        .data) === null || _a === void 0 ? void 0 : _a.items;
                }
                catch (err) {
                    console.error('Something went wrong: ' + err);
                    if (err) {
                        throw new Error('No events');
                    }
                }
            }
        });
        /**
         * Return an Overview availabilities by pleker + the Set of dates.
         */
        this.plekersAvailabilityMapping = () => __awaiter(this, void 0, void 0, function* () {
            const events = yield this.getCurrentEvents();
            if (events === null) {
                console.error('Something went wrong: pleker_availability_day_mapping()');
                throw new Error('No events');
            }
            const plekerMapping = new Map();
            const availableDays = new Set();
            if (events) {
                // @ts-ignore
                events.forEach((event) => {
                    // check name event ? for pleker
                    const plekerId = event.creator.email;
                    const startDate = event.start.dateTime || event.start.date;
                    if (!plekerMapping.get(plekerId)) {
                        plekerMapping.set(plekerId, { availability_dates: [startDate] }); // perform UTC change
                    }
                    else {
                        // pleker already exist
                        const current_dates = plekerMapping.get(plekerId).availability_dates;
                        plekerMapping.set(plekerId, { availability_dates: [startDate, ...current_dates] });
                    }
                    const dt = luxon_1.DateTime.fromISO(startDate).setLocale('fr');
                    availableDays.add(dt.toLocaleString(luxon_1.DateTime.DATE_SHORT));
                });
                plekerMapping.set('days', [...availableDays]);
            }
            return Object.fromEntries(plekerMapping);
            // return events;
        });
        /**
         * Return availabilities by a Set of dates.
         *
         * @return Days_availability_mapped object Map<day:string
         * {availabilities: [string], pleks: [string], plekers: [string]}>
         */
        this.daysAvailabilityMapping = () => __awaiter(this, void 0, void 0, function* () {
            const events = yield this.getCurrentEvents();
            if (events === null) {
                console.error('Something went wrong: days_availability_mapping()');
                throw new Error('No events');
            }
            const daysCounter = new Map();
            if (events) {
                // @ts-ignore
                events.forEach((event) => {
                    const isPlekType = event.status !== 'confirmed' || event.summary === 'PLEK';
                    // const plekerId = event.attendees[0]?.email ?? event.creator.email;
                    const plekerId = event.creator.email;
                    const startDate = event.start.dateTime || event.start.date;
                    const event_day = luxon_1.DateTime.fromISO(startDate)
                        .setLocale('fr')
                        .toLocaleString(luxon_1.DateTime.DATE_SHORT);
                    const day_elements = daysCounter.get(event_day);
                    const updatingAvailabilities = () => {
                        const is_pleker_already_counted_this_day = day_elements === null || day_elements === void 0 ? void 0 : day_elements.plekersEmail.includes(plekerId);
                        let updated_data_day;
                        if (day_elements) {
                            if (isPlekType) {
                                updated_data_day = {
                                    availibilties: day_elements.availibilties,
                                    totalBookedPleks: day_elements.totalBookedPleks + 1,
                                    plekersEmail: [...day_elements.plekersEmail],
                                };
                            }
                            else {
                                updated_data_day = {
                                    availibilties: day_elements.availibilties + 1,
                                    totalBookedPleks: day_elements.totalBookedPleks,
                                    plekersEmail: is_pleker_already_counted_this_day
                                        ? [...day_elements.plekersEmail]
                                        : [...day_elements.plekersEmail, plekerId],
                                };
                            }
                            daysCounter.set(event_day, updated_data_day);
                        }
                    };
                    const creatingDayRecord = () => {
                        daysCounter.set(event_day, {
                            availibilties: isPlekType ? 0 : 1,
                            totalBookedPleks: isPlekType ? 1 : 0,
                            plekersEmail: [plekerId],
                        });
                    };
                    day_elements ? updatingAvailabilities() : creatingDayRecord();
                });
            }
            return daysCounter;
        });
        /* input: plekId, plekerId, start_date_iso_plek, end_date_iso_plek, location ...*/
        // add a *subject* is required
        this.createEvent = () => __awaiter(this, void 0, void 0, function* () {
            var _b;
            const calendarEvent = {
                summary: 'PLEK',
                status: 'tentative',
                description: 'plekId, tasks and all are going here',
                // location: 'location to add here', // could be add here but need to be sure of the visibility
                // visibility: 'private', // not sure if service can see it
                start: {
                    dateTime: '2022-10-08T18:18:00Z',
                    timeZone: 'Europe/Paris',
                },
                end: {
                    dateTime: '2022-10-08T19:19:00Z',
                    timeZone: 'Europe/Paris',
                },
                attendees: [{ email: 'pleker@mail.com' }],
            };
            try {
                const res = (
                // @ts-ignore
                (yield ((_b = this.calendar_instance) === null || _b === void 0 ? void 0 : _b.events.insert({
                    calendarId: GOOGLE_CALENDAR_ID,
                    resource: calendarEvent,
                }))).data);
                console.log(res);
            }
            catch (err) {
                console.error('Something went wrong: ' + err);
                if (err) {
                    throw new Error('No events');
                }
            }
        });
        if (!this.calendar_instance) {
            this.initCalendarInstance();
        }
        else {
            console.log(`Calendar already init :)`);
        }
    }
    getCurrentEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getEventsListFromCalendar();
        });
    }
    initCalendarInstance() {
        var _a;
        const GOOGLE_PRIVATE_KEY = (_a = process.env.PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n');
        const GOOGLE_CLIENT_EMAIL = process.env.CLIENT_EMAIL;
        const GOOGLE_PROJECT_NUMBER = process.env.PROJECT_NUMBER;
        const SUBJECT_EMAIL = process.env.SUBJECT_EMAIL;
        const SCOPES = ['https://www.googleapis.com/auth/calendar'];
        const jwtClient = new googleapis_1.google.auth.JWT(GOOGLE_CLIENT_EMAIL, undefined, GOOGLE_PRIVATE_KEY, SCOPES, SUBJECT_EMAIL);
        // @ts-ignore
        this.calendar_instance = googleapis_1.google.calendar({
            version: 'v3',
            project: GOOGLE_PROJECT_NUMBER,
            auth: jwtClient,
        });
        // init events
        this.getEventsListFromCalendar().then();
    }
    // todo :
    // 2) write test
    // 3) alert no events email;
    /**
     *  @param(selected_date_iso_format) incoming string iso date
     *  @param(available_days_mapping) Map of available days
     *
     *  @return the same or the closest date available as string
     */
    getClosestDaysFrom(selected_date_iso_format, available_days_mapping) {
        const selected_date_fr_format = (0, utils_1.IsoStringToShortFrDate)(selected_date_iso_format);
        let flag = false;
        let min_diff_value = 365;
        let min_date = selected_date_fr_format;
        available_days_mapping.forEach((value, key_date) => {
            if (value.pleks < value.availabilities) {
                if (!flag) {
                    if (key_date !== selected_date_fr_format) {
                        const diff = Math.abs((0, utils_1.checkDaysDiff)(key_date, selected_date_iso_format));
                        if (diff < min_diff_value) {
                            min_diff_value = diff;
                            min_date = key_date;
                        }
                    }
                    else {
                        min_date = selected_date_fr_format;
                        flag = true;
                    }
                }
            }
        });
        return (0, utils_1.shortFrDateToDateTimeObject)(min_date);
    }
    getNextDaysAvailable(available_days_mapping) {
        const daysAvailable = [];
        available_days_mapping.forEach((value, date) => {
            if (value.totalBookedPleks < value.availibilties) {
                daysAvailable.push((0, utils_1.shortFrDateToDateTimeObject)(date).toISO());
            }
        });
        return daysAvailable;
    }
}
exports.CalendarG = CalendarG;
