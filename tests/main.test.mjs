import test from 'node:test';
import assert from 'node:assert/strict';
import { CalendarG } from '../build/services/calendar.service.js';

// todo do all the following beforeAll async
const nodeConf = () => 'cool stuff';
// write mocks after here:
const get_mock_days_availability_with_same_day = () => {
	const mock_days_availability_with_same_day = new Map();
	mock_days_availability_with_same_day.set('04/10/2022', {
		availabilities: 1,
		pleks: 0,
		plekers: ['thomas.gouty@pleko.ca'],
	});
	mock_days_availability_with_same_day.set('05/10/2022', {
		availabilities: 1,
		pleks: 0,
		plekers: ['thomas.gouty@pleko.ca'],
	});
	mock_days_availability_with_same_day.set('06/10/2022', {
		availabilities: 1,
		pleks: 0,
		plekers: ['thomas.gouty@pleko.ca'],
	});
	return mock_days_availability_with_same_day;
};
const mocking_inputs_create_event = () => {
	console.log(
		new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 18, 30)
	);
	return {
		plekId: 'TEST',
		plekerId: 'goutybattlenet@gmail.com',
		start_date_iso_plek: new Date(
			new Date().getFullYear(),
			new Date().getMonth(),
			new Date().getDate(),
			18,
			30
		).toISOString(),
		end_date_iso_plek: new Date(
			new Date().getFullYear(),
			new Date().getMonth(),
			new Date().getDate(),
			19,
			30
		).toISOString(),
		fullAddress: '188 bd rabatau marseille 13010',
	};
};
const calendar = new CalendarG();

// test('test config running', async (_t) => {
// 	before(() => console.log('about to run some test'));
// 	assert.equal(nodeConf(), 'cool stuff');
// });

function main() {
	test('1) Is Events on the agenda', async (_t) => {
		const is_events = true;

		const res_events = await calendar.getEventsListFromCalendar();
		const condition_result = res_events.length > 0;

		assert.equal(condition_result, is_events);
	});

	test('2) Days available Mapping', async (t) => {
		await t.test('...should return the first day further available', async (t) => {});
	});

	test('3) Closest days tests...', async (t) => {
		await t.test('...should return the same date when this slot is available', async (t) => {
			const same_today_iso_date = new Date('2022-10-05T15:24:18.000Z').toISOString();
			const mock_data = get_mock_days_availability_with_same_day();
			const live_data = await calendar.days_availability_mapping();

			const date_fr_res = calendar.getClosestDaysFrom(
				same_today_iso_date,
				mock_data //live_data,
			);

			const expected_result = '05/10/2022';
			assert.equal(date_fr_res, expected_result);
		});

		// todo
		await t.test('...should return the first day further available', async (t) => {
			// Ex --> input: 5/10 , days_availability: 8/10(res), 9/10
			/*		const same_today_iso_date = new Date('2022-10-05T15:24:18.000Z').toISOString();
			const mock_data = get_mock_days_availability_with_same_day();
			const live_data = await calendar.days_availability_mapping();

			const date_fr_res = calendar.get_closest_days_from(
				same_today_iso_date,
				mock_data //live_data,
			);

			const expected_result = '05/10/2022';
			assert.equal(date_fr_res, expected_result);*/
		});
		// todo
		await t.test('...should return the last day further available', async (t) => {
			// Ex --> input: 15/10 , days_availability: 8/10, 9/10(res)
			/*		const same_today_iso_date = new Date('2022-10-05T15:24:18.000Z').toISOString();
					const mock_data = get_mock_days_availability_with_same_day();
					const live_data = await calendar.days_availability_mapping();

					const date_fr_res = calendar.get_closest_days_from(
						same_today_iso_date,
						mock_data //live_data,
					);

					const expected_result = '05/10/2022';
					assert.equal(date_fr_res, expected_result);*/
		});
		// todo
		await t.test('...should return the previous-last day further available', async (t) => {
			// Ex --> input: 15/10 , days_availability: 8/10(res), 9/10(full)
			/*		const same_today_iso_date = new Date('2022-10-05T15:24:18.000Z').toISOString();
					const mock_data = get_mock_days_availability_with_same_day();
					const live_data = await calendar.days_availability_mapping();

					const date_fr_res = calendar.get_closest_days_from(
						same_today_iso_date,
						mock_data //live_data,
					);

					const expected_result = '05/10/2022';
					assert.equal(date_fr_res, expected_result);*/
		});
	});

	test('4) Create event ', async (t) => {
		await t.test('...should works when ', async (t) => {
			const input_mock_data = mocking_inputs_create_event();
			await assert.doesNotThrow(async () => {
				await calendar.createEvent(input_mock_data);
			});
		});
	});
}
// main()

function specificTest() {
	test('test createEvent running', async (_t) => {
		const input_mock_data = mocking_inputs_create_event();
		await assert.doesNotThrow(async () => {
			await calendar.createEvent(input_mock_data);
		});
	});
}
specificTest();
