// Copyright (C) 2020 Storj Labs, Inc.
// See LICENSE for copying information.

<template>
    <div>
        <div class="held-history-table-container--large">
            <div class="held-history-table-container--large__labels-area">
                <div class="column justify-start column-1">
                    <p class="held-history-table-container--large__labels-area__text">Satellite</p>
                </div>
                <div class="column justify-end column-2">
                    <p class="held-history-table-container--large__labels-area__text">Month 1-3</p>
                </div>
                <div class="column justify-end column-3">
                    <p class="held-history-table-container--large__labels-area__text">Month 4-6</p>
                </div>
                <div class="column justify-end column-4">
                    <p class="held-history-table-container--large__labels-area__text">Month 7-9</p>
                </div>
            </div>
            <div v-for="item in monthlyBreakdown" class="held-history-table-container--large__info-area" :key="item.satelliteID">
                <div class="justify-start column-1">
                    <p class="held-history-table-container--large__info-area__text">{{ item.satelliteName }}</p>
                    <p class="held-history-table-container--large__info-area__months">{{ item.age }} month</p>
                </div>
                <div class="column justify-end column-2">
                    <p class="held-history-table-container--large__info-area__text">{{ item.firstPeriod | centsToDollars }}</p>
                </div>
                <div class="column justify-end column-3">
                    <p class="held-history-table-container--large__info-area__text">{{ item.secondPeriod | centsToDollars }}</p>
                </div>
                <div class="column justify-end column-4">
                    <p class="held-history-table-container--large__info-area__text">{{ item.thirdPeriod | centsToDollars }}</p>
                </div>
            </div>
        </div>
        <div class="held-history-table-container--small">
            <HeldHistoryMonthlyBreakdownTableItemSmall
                v-for="item in monthlyBreakdown"
                :held-history-item="item"
                :key="item.satelliteID"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import BaseHeldHistoryTable from '@/app/components/payments/BaseHeldHistoryTable.vue';
import HeldHistoryMonthlyBreakdownTableItemSmall from '@/app/components/payments/HeldHistoryMonthlyBreakdownTableItemSmall.vue';

import { HeldHistoryMonthlyBreakdownItem } from '@/app/types/payout';

@Component({
    components: {
        HeldHistoryMonthlyBreakdownTableItemSmall,
    },
})
export default class HeldHistoryMonthlyBreakdownTable extends BaseHeldHistoryTable {
    /**
     * Returns list of satellite held history items by periods from store.
     */
    public get monthlyBreakdown(): HeldHistoryMonthlyBreakdownItem[] {
        return this.$store.state.payoutModule.heldHistory.monthlyBreakdown;
    }
}
</script>
