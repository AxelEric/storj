// Copyright (C) 2020 Storj Labs, Inc.
// See LICENSE for copying information.

import Vuex from 'vuex';

import { makeNodeModule } from '@/app/store/modules/node';
import { makePayoutModule, PAYOUT_ACTIONS, PAYOUT_MUTATIONS } from '@/app/store/modules/payout';
import {
    EstimatedPayout,
    HeldHistory,
    HeldHistoryAllStatItem,
    HeldHistoryMonthlyBreakdownItem,
    HeldInfo,
    PayoutHistoryItem,
    PayoutInfoRange,
    PayoutPeriod,
    PreviousMonthEstimatedPayout,
    TotalPayoutInfo,
} from '@/app/types/payout';
import { getHeldPercentage, getMonthsBeforeNow } from '@/app/utils/payout';
import { PayoutHttpApi } from '@/storagenode/api/payout';
import { SNOApi } from '@/storagenode/api/storagenode';
import { createLocalVue } from '@vue/test-utils';

const Vue = createLocalVue();
const payoutApi = new PayoutHttpApi();
const payoutModule = makePayoutModule(payoutApi);

const nodeApi = new SNOApi();
const nodeModule = makeNodeModule(nodeApi);

Vue.use(Vuex);

const store = new Vuex.Store({ modules: { payoutModule, node: nodeModule } });

const state = store.state as any;

describe('mutations', (): void => {
    beforeEach(() => {
        createLocalVue().use(Vuex);
    });

    it('sets held information', (): void => {
        const heldInfo = new HeldInfo(13, 12, 11);

        store.commit(PAYOUT_MUTATIONS.SET_HELD_INFO, heldInfo);

        expect(state.payoutModule.heldInfo.usageAtRest).toBe(13);
        expect(state.payoutModule.heldInfo.usageGet).toBe(12);
        expect(state.payoutModule.heldInfo.usagePut).toBe(11);
    });

    it('sets total payout information', (): void => {
        const totalInfo = new TotalPayoutInfo(50, 100, 22);

        store.commit(PAYOUT_MUTATIONS.SET_TOTAL, totalInfo);

        expect(state.payoutModule.totalHeldAmount).toBe(50);
        expect(state.payoutModule.totalEarnings).toBe(100);
        expect(state.payoutModule.currentMonthEarnings).toBe(22);
    });

    it('sets period range', (): void => {
        const range = new PayoutInfoRange(new PayoutPeriod(2019, 2), new PayoutPeriod(2020, 3));

        store.commit(PAYOUT_MUTATIONS.SET_RANGE, range);

        if (!state.payoutModule.periodRange.start) {
            fail('periodRange.start is null');
        }

        expect(state.payoutModule.periodRange.start.period).toBe('2019-03');
        expect(state.payoutModule.periodRange.end.period).toBe('2020-04');
    });

    it('sets held percentage', (): void => {
        const expectedHeldPercentage = 75;

        store.commit(PAYOUT_MUTATIONS.SET_HELD_PERCENT, expectedHeldPercentage);

        expect(state.payoutModule.heldPercentage).toBe(expectedHeldPercentage);
    });

    it('sets held history', (): void => {
        const testJoinAt = new Date(Date.UTC(2020, 0, 30));

        const testHeldHistory = new HeldHistory(
            [
                new HeldHistoryMonthlyBreakdownItem('1', 'name1', 1, 50000, 0, 0),
                new HeldHistoryMonthlyBreakdownItem('2', 'name2', 5, 50000, 422280, 0),
                new HeldHistoryMonthlyBreakdownItem('3', 'name3', 6, 50000, 7333880, 7852235),
            ],
            [
                new HeldHistoryAllStatItem('1', 'name1', 1, 1000000, 0, testJoinAt),
                new HeldHistoryAllStatItem('2', 'name2', 5, 300000, 20, testJoinAt),
            ],
        );

        store.commit(PAYOUT_MUTATIONS.SET_HELD_HISTORY, testHeldHistory);

        expect(state.payoutModule.heldHistory.monthlyBreakdown.length).toBe(testHeldHistory.monthlyBreakdown.length);
        expect(state.payoutModule.heldHistory.monthlyBreakdown[1].satelliteName).toBe(testHeldHistory.monthlyBreakdown[1].satelliteName);
        expect(state.payoutModule.heldHistory.allStats.length).toBe(testHeldHistory.allStats.length);
        expect(state.payoutModule.heldHistory.allStats[0].joinedAt).toBe(testJoinAt);
        expect(state.payoutModule.heldHistory.allStats[1].totalHeld).toBe(30);
    });

    it('sets estimated payout information', (): void => {
        const estimatedPayout = new EstimatedPayout(
            new PreviousMonthEstimatedPayout(
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
            ),
            new PreviousMonthEstimatedPayout(
                10,
                11,
                12,
                13,
                14,
                15,
                16,
                17,
                18,
            ),
        );

        store.commit(PAYOUT_MUTATIONS.SET_ESTIMATION, estimatedPayout);

        expect(state.payoutModule.estimation.currentMonth.payout).toBe(8);
        expect(state.payoutModule.estimation.previousMonth.heldRate).toBe(16);
    });

    it('sets available periods', (): void => {
        const firstExpectedPeriod = '2020-04';
        const secondExpectedPeriod = '1999-11';
        const incomingDataSet = [firstExpectedPeriod, secondExpectedPeriod];

        store.commit(PAYOUT_MUTATIONS.SET_PERIODS, incomingDataSet);

        expect(state.payoutModule.payoutPeriods.length).toBe(2);
        expect(state.payoutModule.payoutPeriods[0]).toBe(firstExpectedPeriod);
        expect(state.payoutModule.payoutPeriods[1]).toBe(secondExpectedPeriod);
    });

    it('sets payout history period', (): void => {
        const expectedPeriod = '2020-04';

        store.commit(PAYOUT_MUTATIONS.SET_PAYOUT_HISTORY_PERIOD, expectedPeriod);

        expect(state.payoutModule.payoutHistoryPeriod).toBe(expectedPeriod);
    });

    it('sets payout history period', (): void => {
        const payoutHistory = [
            new PayoutHistoryItem('1', 'name1', 1, 10, 120, 140,
                50, 60, 20, 80, 'receipt1', false,
            ),
            new PayoutHistoryItem('2', 'name2', 16, 10, 120, 140,
                50, 60, 20, 80, 'receipt2', true,
            ),
        ];
        store.commit(PAYOUT_MUTATIONS.SET_PAYOUT_HISTORY, payoutHistory);

        expect(state.payoutModule.payoutHistory.length).toBe(payoutHistory.length);
        expect(state.payoutModule.payoutHistory[0].satelliteID).toBe(payoutHistory[0].satelliteID);
        expect(state.payoutModule.payoutHistory[1].receipt).toBe(payoutHistory[1].receipt);
    });
});

describe('actions', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('success get held info by month', async (): Promise<void> => {
        jest.spyOn(payoutApi, 'getHeldInfoByMonth').mockReturnValue(
            Promise.resolve(new HeldInfo(1, 2 , 3, 4, 5)),
        );

        const range = new PayoutInfoRange(null, new PayoutPeriod(2020, 3));

        store.commit(PAYOUT_MUTATIONS.SET_RANGE, range);

        await store.dispatch(PAYOUT_ACTIONS.GET_HELD_INFO);

        expect(state.payoutModule.heldInfo.usagePut).toBe(3);
        expect(state.payoutModule.heldInfo.held).toBe(0);
        expect(state.payoutModule.heldPercentage).toBe(getHeldPercentage(new Date()));
    });

    it('get held info by month throws an error when api call fails', async (): Promise<void> => {
        jest.spyOn(payoutApi, 'getHeldInfoByMonth').mockImplementation(() => { throw new Error(); });

        try {
            await store.dispatch(PAYOUT_ACTIONS.GET_HELD_INFO);
            expect(true).toBe(false);
        } catch (error) {
            expect(state.payoutModule.heldInfo.usagePut).toBe(3);
            expect(state.payoutModule.heldInfo.held).toBe(0);
        }
    });

    it('success get held info by period', async (): Promise<void> => {
        jest.spyOn(payoutApi, 'getHeldInfoByPeriod').mockReturnValue(
            Promise.resolve(new HeldInfo(1, 2 , 3, 4, 5)),
        );

        const range = new PayoutInfoRange(new PayoutPeriod(2019, 2), new PayoutPeriod(2020, 3));

        store.commit(PAYOUT_MUTATIONS.SET_RANGE, range);

        await store.dispatch(PAYOUT_ACTIONS.GET_HELD_INFO);

        expect(state.payoutModule.heldInfo.usagePut).toBe(3);
        expect(state.payoutModule.heldInfo.held).toBe(0);
    });

    it('get held info by period throws an error when api call fails', async (): Promise<void> => {
        jest.spyOn(payoutApi, 'getHeldInfoByPeriod').mockImplementation(() => { throw new Error(); });

        try {
            await store.dispatch(PAYOUT_ACTIONS.GET_HELD_INFO);
            expect(true).toBe(false);
        } catch (error) {
            expect(state.payoutModule.heldInfo.usagePut).toBe(3);
            expect(state.payoutModule.heldInfo.held).toBe(0);
        }
    });

    it('success get total', async (): Promise<void> => {
        jest.spyOn(payoutApi, 'getTotal').mockReturnValue(
            Promise.resolve(new TotalPayoutInfo(10, 20, 5)),
        );

        await store.dispatch(PAYOUT_ACTIONS.GET_TOTAL);

        expect(state.payoutModule.totalHeldAmount).toBe(10);
        expect(state.payoutModule.totalEarnings).toBe(20);
        expect(state.payoutModule.currentMonthEarnings).toBe(0);
    });

    it('get total throws an error when api call fails', async (): Promise<void> => {
        jest.spyOn(payoutApi, 'getTotal').mockImplementation(() => { throw new Error(); });

        try {
            await store.dispatch(PAYOUT_ACTIONS.GET_TOTAL);
            expect(true).toBe(false);
        } catch (error) {
            expect(state.payoutModule.totalHeldAmount).toBe(10);
            expect(state.payoutModule.totalEarnings).toBe(20);
            expect(state.payoutModule.currentMonthEarnings).toBe(0);
        }
    });

    it('success fetches available periods', async (): Promise<void> => {
        const firstExpectedPeriod = '2020-04';
        const secondExpectedPeriod = '1999-11';

        jest.spyOn(payoutApi, 'getPayoutPeriods').mockReturnValue(
            Promise.resolve([
                PayoutPeriod.fromString(firstExpectedPeriod),
                PayoutPeriod.fromString(secondExpectedPeriod),
            ]),
        );

        await store.dispatch(PAYOUT_ACTIONS.GET_PERIODS);

        expect(state.payoutModule.payoutPeriods.length).toBe(2);
        expect(state.payoutModule.payoutPeriods[0].period).toBe(firstExpectedPeriod);
        expect(state.payoutModule.payoutPeriods[1].period).toBe(secondExpectedPeriod);
    });

    it('get available periods throws an error when api call fails', async () => {
        jest.spyOn(payoutApi, 'getPayoutPeriods').mockImplementation(() => { throw new Error(); });

        try {
            await store.dispatch(PAYOUT_ACTIONS.GET_PERIODS);
            expect(true).toBe(false);
        } catch (error) {
            expect(state.payoutModule.payoutPeriods.length).toBe(2);
        }
    });

    it('success get held history', async (): Promise<void> => {
        const testJoinAt = new Date(Date.UTC(2020, 0, 30));

        jest.spyOn(payoutApi, 'getHeldHistory').mockReturnValue(
            Promise.resolve(new HeldHistory(
                [
                    new HeldHistoryMonthlyBreakdownItem('1', 'name1', 1, 50000, 0, 0),
                    new HeldHistoryMonthlyBreakdownItem('2', 'name2', 5, 50000, 422280, 0),
                    new HeldHistoryMonthlyBreakdownItem('3', 'name3', 6, 50000, 7333880, 7852235),
                ],
                [
                    new HeldHistoryAllStatItem('1', 'name1', 1, 100, 0, testJoinAt),
                    new HeldHistoryAllStatItem('2', 'name2', 5, 300000, 20, testJoinAt),
                ],
            )),
        );

        await store.dispatch(PAYOUT_ACTIONS.GET_HELD_HISTORY);

        expect(state.payoutModule.heldHistory.monthlyBreakdown.length).toBe(3);
        expect(state.payoutModule.heldHistory.monthlyBreakdown[1].satelliteName).toBe('name2');
        expect(state.payoutModule.heldHistory.allStats.length).toBe(2);
        expect(state.payoutModule.heldHistory.allStats[0].joinedAt).toBe(testJoinAt);
        expect(state.payoutModule.heldHistory.allStats[1].totalHeld).toBe(30);
    });

    it('get total throws an error when api call fails', async (): Promise<void> => {
        jest.spyOn(payoutApi, 'getHeldHistory').mockImplementation(() => { throw new Error(); });

        try {
            await store.dispatch(PAYOUT_ACTIONS.GET_HELD_HISTORY);
            expect(true).toBe(false);
        } catch (error) {
            expect(state.payoutModule.heldHistory.monthlyBreakdown.length).toBe(3);
            expect(state.payoutModule.heldHistory.monthlyBreakdown[1].satelliteName).toBe('name2');
        }
    });

    it('sets payout history period', async (): Promise<void> => {
        const expectedPeriod = '2020-01';

        await store.dispatch(PAYOUT_ACTIONS.SET_PAYOUT_HISTORY_PERIOD, expectedPeriod);

        expect(state.payoutModule.payoutHistoryPeriod).toBe(expectedPeriod);
    });

    it('get payout history throws an error when api call fails', async (): Promise<void> => {
        jest.spyOn(payoutApi, 'getPayoutHistory').mockImplementation(() => { throw new Error(); });

        try {
            await store.dispatch(PAYOUT_ACTIONS.GET_PAYOUT_HISTORY);
            expect(true).toBe(false);
        } catch (error) {
            expect(state.payoutModule.payoutHistory.length).toBe(2);
            expect(state.payoutModule.payoutHistory[1].satelliteName).toBe('name2');
        }
    });

    it('success get payout history', async (): Promise<void> => {
        jest.spyOn(payoutApi, 'getPayoutHistory').mockReturnValue(
            Promise.resolve([
                new PayoutHistoryItem('1', 'name1', 1, 100000, 2200000, 140,
                    500000, 600000, 200000, 800000, 'receipt1', false,
                ),
            ]),
        );

        await store.dispatch(PAYOUT_ACTIONS.GET_PAYOUT_HISTORY);

        expect(state.payoutModule.payoutHistory.length).toBe(1);
        expect(state.payoutModule.payoutHistory[0].satelliteName).toBe('name1');
        expect(state.payoutModule.payoutHistory[0].surge).toBe(220);
    });
});

describe('getters', () => {
    it('getter totalPaidForPayoutHistoryPeriod returns correct value',  async (): Promise<void> => {
        jest.spyOn(payoutApi, 'getPayoutHistory').mockReturnValue(
            Promise.resolve([
                new PayoutHistoryItem('1', 'name1', 1, 10, 120, 140,
                    50, 60, 20, 1300000, 'receipt1', false,
                ),
                new PayoutHistoryItem('2', 'name2', 16, 10, 120, 140,
                    50, 60, 20, 1700000, 'receipt2', true,
                ),
            ]),
        );

        await store.dispatch(PAYOUT_ACTIONS.GET_PAYOUT_HISTORY);

        expect(store.getters.totalPaidForPayoutHistoryPeriod).toBe(300);
    });

    it('get estimated payout information throws an error when api call fails', async (): Promise<void> => {
        jest.spyOn(payoutApi, 'getEstimatedInfo').mockImplementation(() => { throw new Error(); });

        try {
            await store.dispatch(PAYOUT_ACTIONS.GET_ESTIMATION);
            expect(true).toBe(false);
        } catch (error) {
            expect(state.payoutModule.estimation.currentMonth.held).toBe(9);
            expect(state.payoutModule.estimation.previousMonth.diskSpace).toBe(14);
        }
    });

    it('success get estimated payout information', async (): Promise<void> => {
        jest.spyOn(payoutApi, 'getEstimatedInfo').mockReturnValue(
            Promise.resolve(new EstimatedPayout(
                new PreviousMonthEstimatedPayout(
                    1,
                    2,
                    300,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                ),
                new PreviousMonthEstimatedPayout(
                    10,
                    11,
                    12,
                    13,
                    700,
                    15,
                    16,
                    17,
                    18,
                ),
            )),
        );

        await store.dispatch(PAYOUT_ACTIONS.GET_ESTIMATION);

        expect(state.payoutModule.estimation.currentMonth.egressRepairAudit).toBe(300);
        expect(state.payoutModule.estimation.previousMonth.diskSpace).toBe(700);
    });
});

describe('utils functions', (): void => {
    const _Date = Date;

    // TODO: investigate reset mocks in config
    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        global.Date = _Date;
    });

    it('get correct held percentage', (): void => {
        const testDates: Date[] = [
            new Date(Date.UTC(2020, 0, 30)),
            new Date(Date.UTC(2019, 10, 29)),
            new Date(Date.UTC(2019, 7, 24)),
            new Date(Date.UTC(2018, 1, 24)),
        ];
        const expectedHeldPercentages: number[] = [75, 50, 25, 0];

        const mockedDate = new Date(1580522290000); // Sat Feb 01 2020
        global.Date = jest.fn(() => mockedDate);

        for (let i = 0; i < testDates.length; i++) {
            const heldPercentage = getHeldPercentage(testDates[i]);

            expect(heldPercentage).toBe(expectedHeldPercentages[i]);
        }
    });

    it('get correct months difference', (): void => {
        const testDates: Date[] = [
            new Date(Date.UTC(2020, 0, 30)),
            new Date(Date.UTC(2019, 10, 29)),
            new Date(Date.UTC(2019, 7, 24)),
            new Date(Date.UTC(2018, 1, 24)),
        ];
        const expectedMonthsCount: number[] = [2, 4, 7, 25];

        const mockedDate = new Date(1580522290000); // Sat Feb 01 2020
        global.Date = jest.fn(() => mockedDate);

        for (let i = 0; i < testDates.length; i++) {
            const heldPercentage = getMonthsBeforeNow(testDates[i]);

            expect(heldPercentage).toBe(expectedMonthsCount[i]);
        }
    });
});
