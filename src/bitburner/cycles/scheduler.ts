import { NS } from "NetScriptDefinitions";
import { Allocations } from "cycles/models";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL");
    ns.enableLog("exec");
    const pids: Map<string, number> = new Map<string, number>();

    while (true) {
        const { hwgw, global, allocations: { workerTargetAssignments } } = await getPortData(ns);

        for (const { target } of workerTargetAssignments) {
            if (!pids[target])
                pids[target] = 0;
        }

        ns.print(`Assignments:\n\t${JSON.stringify(workerTargetAssignments)}`);
        // let run = 1;


        for (const { target, worker, batchProperties } of workerTargetAssignments) {

            if (!ns.isRunning(pids[target])) {
                ns.print(`Starting run for ${target} on server ${worker}`);

                const needsFixing = levelSetTarget(ns, target, hwgw);

                const { hackThreads, hackSecurityOffsetThreads, growThreads, growSecurityOffsetThreads, batchTiming } = batchProperties;
                const { hackSleep, hackSecSleep, growSecSleep, growSleep } = batchTiming;

                let now = Date.now() + 100;
                for (let i = 0; i < 1; i++) {

                    if (!needsFixing.fixHack) {
                        pids[target] = ns.exec("h.js", worker, hackThreads, target, now, hackSleep, false, 0);
                    }

                    ns.exec("w.js", worker, hackSecurityOffsetThreads, target, now, hackSecSleep, false, 0);
                    if (!needsFixing.fixHack || needsFixing.fixMoney) {
                        ns.exec("g.js", worker, growThreads, target, now, growSleep, false, 0);
                    }

                    pids[target] = ns.exec("w.js", worker, growSecurityOffsetThreads, target, now, growSecSleep, false, 0);

                    ns.print(`Starting run for ${target} on server ${worker} with pid ${pids[target]}`);
                    now += (hwgw.scriptDelay * 4);
                    if (needsFixing.fixHack) {
                        ns.toast(`Need to fix ${target} [${JSON.stringify(needsFixing)}]`, "warning");
                        break;
                    }
                }
            }

            await ns.sleep(hwgw["sleepTime"] || global["sleepTime"]);

        }
        //safty sleep
        await ns.sleep(hwgw["sleepTime"] || global["sleepTime"]);
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

function correctMoney(ns: NS, target: string, hwgw: HWGWConfig) {
    return Math.ceil((ns.getServerMaxMoney(target) * hwgw.moneyPercentage) - ns.getServerMoneyAvailable(target));
}

function levelSetTarget(ns: NS, target: string, hwgw: HWGWConfig) {
    const fixSec = correctSecurity(ns, target);
    const fixMoney = correctMoney(ns, target, hwgw);
    return { fixHack: fixSec != 0 || fixMoney >= 0, fixMoney: fixMoney >= 0, money: fixMoney, fixSecurity: fixSec != 0, security: fixSec };
}
