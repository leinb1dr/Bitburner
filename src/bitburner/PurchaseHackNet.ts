import { NS } from "NetScriptDefinitions";

function myMoney(ns: NS) {
    return ns.getServerMoneyAvailable("home");
}

// async function waitForMoney(ns: NS, cost: number) {
//     ns.print(`Need $${cost}.`);
//     while (myMoney(ns) < cost) {
//         await ns.sleep(3000);
//     }
// }

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("sleep");
    ns.disableLog("getServerMoneyAvailable");

    const hacknet = ns.hacknet;

    const target = ns.peek(2) as string;
    if (target == "NULL PORT DATA" || target.length == 0) {
        await ns.sleep(1000);
    } else {
        const config = JSON.parse(target) as Configuration;
        const hackNetConfig = config.hackNet;
        const globalConfig = config.global;

        while (hacknet.numNodes() < hackNetConfig.fleetSize) {

            for (let i = 0; i < hacknet.numNodes(); i++) {
                while (hacknet.getNodeStats(i).level < 200 && myMoney(ns) > hacknet.getLevelUpgradeCost(i, hackNetConfig.levelUpgrade)) {
                    hacknet.upgradeLevel(i, hackNetConfig.levelUpgrade);
                    await ns.sleep(10);
                }
            }

            for (let i = 0; i < hacknet.numNodes(); i++) {
                while (hacknet.getNodeStats(i).ram < 64 && myMoney(ns) > hacknet.getRamUpgradeCost(i, hackNetConfig.ramUpgrade)) {
                    hacknet.upgradeRam(i, hackNetConfig.ramUpgrade);
                    await ns.sleep(10);
                }
            }

            for (let i = 0; i < hacknet.numNodes(); i++) {
                while (hacknet.getNodeStats(i).cores < 16 && myMoney(ns) > hacknet.getCoreUpgradeCost(i, hackNetConfig.cpuUpgrade)) {
                    hacknet.upgradeCore(i, hackNetConfig.cpuUpgrade);
                    await ns.sleep(10);
                }
            }

            const cost = hacknet.getPurchaseNodeCost();
            if (myMoney(ns) > cost) {
                const res = hacknet.purchaseNode();
                ns.print("Purchased hacknet Node with index " + res);
            }

            await ns.sleep(hackNetConfig["sleepTime"] || globalConfig["sleepTime"]);
        }
    }
}