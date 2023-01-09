import { NS } from "NetScriptDefinitions";
import { Allocations } from "cycles/models";

type ScriptIds = {
    hack: number,
    hackWeaken: number,
    grow: number,
    growWeaken: number,
    fixHack: boolean
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL");
    // ns.enableLog("exec");
    const pids: Map<string, ScriptIds> = new Map<string, ScriptIds>();

    while (true) {
        const { hwgw, global, allocations: { workerTargetAssignments } } = await getPortData(ns);

        for (const { target } of workerTargetAssignments) {
            if (!pids[target]) {
                pids[target] = {
                    active: 0,
                    fixHack: false
                };
            }
        }


        for (const { target, worker, batchProperties } of workerTargetAssignments) {

            if (!ns.isRunning(pids[target].active)) {
                // ns.print(`Starting run for ${target} on server ${worker}`);
                const needsFixing = levelSetTarget(ns, target);

                const { hackThreads, hackSecurityOffsetThreads, growThreads, growSecurityOffsetThreads, batchTiming, batches } = batchProperties;
                const { hackSleep, hackSecSleep, growSecSleep, growSleep, batchLength } = batchTiming;

                let now = Date.now() + 500;

                for (let i = 0; i < batches; i++) {

                    const batchMode = !needsFixing.fixHack;
                    if (!needsFixing.fixHack) {
                        pids[target].active = ns.exec("h.js", worker, hackThreads, target, now, hackSleep, batchMode, batchLength);
                    }
                    pids[target].hackWeaken = ns.exec("w.js", worker, hackSecurityOffsetThreads, target, now, hackSecSleep, batchMode, batchLength);

                    if (!needsFixing.fixHack || needsFixing.fixMoney) {
                        pids[target].active = ns.exec("g.js", worker, growThreads, target, now, growSleep, batchMode, batchLength);
                    }

                    pids[target].active = ns.exec("w.js", worker, growSecurityOffsetThreads, target, now, growSecSleep, batchMode, batchLength);
                    pids[target].fixHack = needsFixing.fixHack;

                    // ns.print(`Starting run for ${target} on server ${worker} with pid ${pids[target]}`);
                    now += (hwgw.scriptDelay * 4);
                    if (needsFixing.fixHack) {
                        ns.print(`Need to fix ${target} [${JSON.stringify(needsFixing)}]`);
                        break;
                    }
                }
            }
        }

        await ns.sleep(global["sleepTime"]);

    }
}


async function getPortData(ns: NS) {
    let configPortValue = "";
    while (configPortValue == "NULL PORT DATA" || configPortValue.length == 0) {
        await ns.sleep(1000);
        configPortValue = ns.peek(2) as string;
    }

    const { hwgw, global } = JSON.parse(configPortValue) as Configuration;

    let assignmentPortValue = "";
    while (assignmentPortValue == "NULL PORT DATA" || assignmentPortValue.length == 0) {
        await ns.sleep(1000);
        assignmentPortValue = ns.peek(hwgw.port) as string;
    }

    const allocations = JSON.parse(assignmentPortValue) as Allocations;
    return {
        hwgw,
        global,
        allocations
    };
}

function correctSecurity(ns: NS, target: string) {
    return Math.ceil(ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target));
}

function correctMoney(ns: NS, target: string) {
    return Math.ceil(ns.getServerMaxMoney(target) - ns.getServerMoneyAvailable(target));
}

function levelSetTarget(ns: NS, target: string) {
    const fixSec = correctSecurity(ns, target);
    const fixMoney = correctMoney(ns, target);
    return { fixHack: fixSec != 0 || fixMoney != 0, fixMoney: fixMoney != 0, money: fixMoney, fixSecurity: fixSec != 0, security: fixSec };
}
