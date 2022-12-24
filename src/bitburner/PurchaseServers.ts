import { NS } from "NetScriptDefinitions";

function myMoney(ns: NS) {
    return ns.getServerMoneyAvailable("home");
}

async function waitForMoney(ns: NS, cost: number) {
    while (myMoney(ns) < cost)
        await ns.sleep(1000);
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("sleep");
    ns.disableLog("getServerMoneyAvailable");

    while (ns.getPurchasedServers().length < 25) {
        const cost = ns.getPurchasedServerCost(2);
        await waitForMoney(ns, cost);
        ns.purchaseServer("home", 2);
    }

    for (let i = 2; 1 <= 20; i++) {
        const ramUpgrade = Math.pow(2, i);
        for (let j = 0; j < ns.getPurchasedServers().length; j++) {
            if (ns.getServerMaxRam(`home-${j}`) < ramUpgrade) {
                const cost = ns.getPurchasedServerUpgradeCost(`home-${j}`, ramUpgrade);
                ns.print(`Waiting to purchase ${ramUpgrade} ram for home-${j} costing ${cost}`);
                await waitForMoney(ns, cost);
                const success = ns.upgradePurchasedServer(`home-${j}`, ramUpgrade);
                ns.print(`Purchasing ${ramUpgrade} ram for home-${j} was successful: ${success}`);
                if(success){
                    ns.killall(`home-${j}`);
                }
            }
        }
    }

}