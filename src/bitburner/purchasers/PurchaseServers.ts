import { NS } from "NetScriptDefinitions";
import { NetscriptBase } from "NetScriptBase";

export class ServerPurchaser extends NetscriptBase {
    purchaseServerConfig: PurchaseServerConfig;
    globalConfig: GlobalConfig;

    constructor(ns: NS) {
        super(ns);
    }

    public async purchase() {
        await this.init();
        if (this.ns.getPurchasedServers().length < this.purchaseServerConfig.poolSize) {
            const cost = this.ns.getPurchasedServerCost(2);
            if (this.support.hasMoney(cost)) this.ns.purchaseServer("home", 2);
        } else {
            let i = 2;

            for (; i <= this.purchaseServerConfig.ramExponent; i++) {
                const ramUpgrade = Math.pow(2, i);
                for (let j = 0; j < this.ns.getPurchasedServers().length; j++) {
                    if (this.ns.getServerMaxRam("home") < ramUpgrade) {
                        const cost = this.ns.singularity.getUpgradeHomeRamCost();
                        //this.ns.print(`${i}: Waiting to purchase ${ramUpgrade} ram for home-${j} costing ${(cost / 1_000_000).toFixed(2)}M`);
                        if (this.support.hasMoney(cost)) {
                            const success = this.ns.singularity.upgradeHomeRam();
                            //this.ns.print(`Purchasing ${ramUpgrade} ram for home-${j} was successful: ${success}`);
                        }
                    }

                    if (this.ns.getServerMaxRam(`home-${j}`) < ramUpgrade) {
                        const cost = this.ns.getPurchasedServerUpgradeCost(`home-${j}`, ramUpgrade);
                        //this.ns.print(`${i}: Waiting to purchase ${ramUpgrade} ram for home-${j} costing ${(cost / 1_000_000).toFixed(2)}M`);
                        if (this.support.hasMoney(cost)) {
                            const success = this.ns.upgradePurchasedServer(`home-${j}`, ramUpgrade);
                            //this.ns.print(`Purchasing ${ramUpgrade} ram for home-${j} was successful: ${success}`);
                            if (success) {
                                this.ns.killall(`home-${j}`);
                            }
                        }
                    }
                }
            }

        }
    }

    protected async init() {
        const config = await this.support.getConfiguration();
        this.purchaseServerConfig = config.purchaseServer;
        this.globalConfig = config.global;

    }
}


/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("sleep");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("getServerMaxRam");
    const purchase = new ServerPurchaser(ns);
    while (true) {
        purchase.purchase();

        await ns.sleep(purchase.purchaseServerConfig["sleepTime"] || purchase.globalConfig["sleepTime"]);

    }

}