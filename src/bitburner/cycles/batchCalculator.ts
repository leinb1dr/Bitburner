import { NS } from "NetScriptDefinitions";
import { BatchProperties, BatchTiming } from "./models";

export class BatchCalculator {
    ns: NS;
    scriptDelay: number
    moneyPercentage: number

    constructor(ns: NS, hwgw: HWGWConfig) {
        this.ns = ns;
        this.scriptDelay = hwgw.scriptDelay;
        this.moneyPercentage = hwgw.moneyPercentage;
    }

    getBatchProperties(target:string, allowBatching:boolean): BatchProperties {
        const maxMoney = this.ns.getServerMaxMoney(target);
        if(maxMoney <= 0) return null;

        const money = Math.max(maxMoney*this.moneyPercentage,1);

        const hackThreads = Math.max(Math.ceil(this.ns.hackAnalyzeThreads(target, money)), 1),
            hackTime = Math.ceil(this.ns.getHackTime(target)),
            hackSecurityOffsetThreads = Math.max(Math.ceil((hackThreads * .002) / 0.05), 1) + 2,
            growThreads = Math.max(Math.ceil(this.ns.growthAnalyze(target, money)), 1),
            growTime = Math.ceil(this.ns.getGrowTime(target)),
            growSecurityOffsetThreads = Math.max(Math.ceil((growThreads * .004) / 0.05), 1) + 2,
            weakenTime = Math.ceil(this.ns.getWeakenTime(target));

        const batchTiming = this.batchSleepTimes({ weakenTime, hackTime, growTime });

        let batches = 1;
        if(allowBatching){
            batches = Math.floor(batchTiming.batchLength/this.scriptDelay);
        }

        const neededThreads = (hackThreads + hackSecurityOffsetThreads + growThreads + growSecurityOffsetThreads)*batches;

        return {
            money,
            target,
            hackThreads,
            hackTime,
            hackSecurityOffsetThreads,
            growThreads,
            growTime,
            growSecurityOffsetThreads,
            weakenTime,
            batches,
            neededThreads,
            batchTiming
        };
    }

    batchSleepTimes(properties: { weakenTime: number, hackTime: number, growTime: number }): BatchTiming {

        const hackPadding = properties.weakenTime - properties.hackTime;
        const growPadding = properties.weakenTime - properties.growTime;
        const delay = this.scriptDelay;

        const hackSleep = hackPadding-delay;
        const hackSecSleep = 0;
        const growSleep = growPadding+delay;
        const growSecSleep = delay*2;

        const results = {
            hackSleep,
            hackSecSleep,
            growSleep,
            growSecSleep,
            batchLength: growSecSleep + properties.weakenTime
        };

        // this.ns.print("----------------------------------------");
        // this.ns.print(JSON.stringify(properties));
        // this.ns.print(JSON.stringify(results));
        // this.ns.print(hackPadding);
        // this.ns.print(growPadding);
        // this.ns.print(`Hack: Start: 0, Sleep For: ${hackSleep}, Run for: ${properties.hackTime}, End at: ${hackSleep+properties.hackTime}`);
        // this.ns.print(`HackWeak: Start: 0, Sleep For: ${hackSecSleep}, Run for: ${properties.weakenTime}, End at: ${hackSecSleep+properties.weakenTime}`);
        // this.ns.print(`Grow: Start: 0, Sleep For: ${growSleep}, Run for: ${properties.growTime}, End at: ${growSleep+properties.growTime}`);
        // this.ns.print(`GrowWeak: Start: 0, Sleep For: ${growSecSleep}, Run for: ${properties.weakenTime}, End at: ${growSecSleep+properties.weakenTime}`);
        // this.ns.print("----------------------------------------");
        return results;
    }
}