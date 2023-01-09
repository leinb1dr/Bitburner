import { NS } from "NetScriptDefinitions";

function myMoney(ns: NS) {
    return ns.getServerMoneyAvailable("home");
}

async function waitForMoney(ns: NS, cost: number) {
    while (myMoney(ns) < cost)
        await ns.sleep(1000);
}

async function getConfig(ns: NS) {
    let target = ns.peek(2) as string;

    while (target == "NULL PORT DATA" || target.length == 0) {
        await ns.sleep(1000);
        target = ns.peek(2) as string;
    }

    return JSON.parse(target) as Configuration;
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("sleep");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("getServerMaxRam");

    const { purchaseServer: purchaseServerConfig } = await getConfig(ns);

    while (ns.getPurchasedServers().length < purchaseServerConfig.poolSize) {
        const cost = ns.getPurchasedServerCost(2);
        await waitForMoney(ns, cost);
        ns.purchaseServer("home", 2);
    }

    let i = 2;
    while (true) {
        const { purchaseServer: purchaseServerConfig, global: globalConfig } = await getConfig(ns);

        for (; i <= purchaseServerConfig.ramExponent; i++) {
            const ramUpgrade = Math.pow(2, i);
            for (let j = 0; j < ns.getPurchasedServers().length; j++) {
                if (ns.getServerMaxRam(`home-${j}`) < ramUpgrade) {
                    const cost = ns.getPurchasedServerUpgradeCost(`home-${j}`, ramUpgrade);
                    ns.print(`Waiting to purchase ${ramUpgrade} ram for home-${j} costing ${(cost / 1_000_000).toFixed(2)}M`);
                    await waitForMoney(ns, cost);
                    const success = ns.upgradePurchasedServer(`home-${j}`, ramUpgrade);
                    ns.print(`Purchasing ${ramUpgrade} ram for home-${j} was successful: ${success}`);
                    if (success) {
                        ns.killall(`home-${j}`);
                    }
                }
            }
        }

        await ns.sleep(purchaseServerConfig["sleepTime"] || globalConfig["sleepTime"]);

    }

}