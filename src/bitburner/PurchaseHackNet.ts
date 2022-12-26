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

    let target = ns.peek(2) as string;
    while (target == "NULL PORT DATA" || target.length == 0) {
        await ns.sleep(1000);
        target = ns.peek(2) as string;
    }

    const config = JSON.parse(target) as Configuration;
    const hackNetConfig = config.hackNet;
    const globalConfig = config.global;
    let fullyUpgradedRam = false, fullyUpgradedLevel = false, fullyUpgradedCPU = false, fullyPurchaseFleet = false;
    while (!fullyPurchaseFleet || !fullyUpgradedRam || !fullyUpgradedLevel || !fullyUpgradedCPU) {
        fullyUpgradedRam = true, fullyUpgradedLevel = true, fullyUpgradedCPU = true, fullyPurchaseFleet = true;

        for (let i = 0; i < hacknet.numNodes(); i++) {

            if (hacknet.getNodeStats(i).level < 200) fullyUpgradedLevel = false;

            if (hacknet.getNodeStats(i).level < 200 && myMoney(ns) > hacknet.getLevelUpgradeCost(i, hackNetConfig.levelUpgrade)) {
                hacknet.upgradeLevel(i, hackNetConfig.levelUpgrade);
            }
        }

        ns.print(`Hack Nodes Max Level: ${fullyUpgradedLevel}`);

        for (let i = 0; i < hacknet.numNodes(); i++) {
            if (hacknet.getNodeStats(i).ram < 64) fullyUpgradedRam = false;

            if (hacknet.getNodeStats(i).ram < 64 && myMoney(ns) > hacknet.getRamUpgradeCost(i, hackNetConfig.ramUpgrade)) {
                hacknet.upgradeRam(i, hackNetConfig.ramUpgrade);
            }
        }

        ns.print(`Hack Nodes Max Ram: ${fullyUpgradedRam}`);


        for (let i = 0; i < hacknet.numNodes(); i++) {
            if (hacknet.getNodeStats(i).cores < 16) fullyUpgradedCPU = false;

            if (hacknet.getNodeStats(i).cores < 16 && myMoney(ns) > hacknet.getCoreUpgradeCost(i, hackNetConfig.cpuUpgrade)) {
                hacknet.upgradeCore(i, hackNetConfig.cpuUpgrade);
            }
        }

        ns.print(`Hack Nodes Max CPU: ${fullyUpgradedCPU}`);

        if (hacknet.numNodes() < hackNetConfig.fleetSize) {
            fullyPurchaseFleet = false;
            const cost = hacknet.getPurchaseNodeCost();
            if (myMoney(ns) > cost) {
                const res = hacknet.purchaseNode();
                ns.print("Purchased hacknet Node with index " + res);
            }
        }

        ns.print(`Hack Nodes Fleet Maxed: ${fullyPurchaseFleet}`);

        await ns.sleep(hackNetConfig["sleepTime"] || globalConfig["sleepTime"]);
    }

}