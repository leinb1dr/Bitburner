import { NS } from "NetScriptDefinitions";
import { NetscriptBase } from "NetScriptBase";

export class HackNetPurchaser extends NetscriptBase {

    hackNetConfig: HackNetConfig;
    globalConfig: GlobalConfig;

    constructor(ns: NS) {
        super(ns);
    }

    public async purchase() {
        await this.init();
        const hacknet = this.ns.hacknet;

        for (let i = 0; i < hacknet.numNodes(); i++) {
            if (hacknet.getNodeStats(i).level < 200 && this.support.hasMoney(hacknet.getLevelUpgradeCost(i, this.hackNetConfig.levelToUpgrade))) {
                hacknet.upgradeLevel(i, this.hackNetConfig.levelToUpgrade);
            }
        }

        for (let i = 0; i < hacknet.numNodes(); i++) {
            if (hacknet.getNodeStats(i).ram < 64 && this.support.hasMoney(hacknet.getRamUpgradeCost(i, this.hackNetConfig.ramUpgrade))) {
                hacknet.upgradeRam(i, this.hackNetConfig.ramUpgrade);
            }
        }

        for (let i = 0; i < hacknet.numNodes(); i++) {
            if (hacknet.getNodeStats(i).cores < 16 && this.support.hasMoney(hacknet.getCoreUpgradeCost(i, this.hackNetConfig.cpuUpgrade))) {
                hacknet.upgradeCore(i, this.hackNetConfig.cpuUpgrade);
            }
        }

        if (hacknet.numNodes() < this.hackNetConfig.fleetSize) {
            const cost = hacknet.getPurchaseNodeCost();
            if (this.support.hasMoney(cost)) {
                const res = hacknet.purchaseNode();
                //this.ns.print("Purchased hacknet Node with index " + res);
            }
        }

    }

    protected async init() {
        //this.ns.print("Initializing hacknetpurchaser");
        const configuration = await this.support.getConfiguration();
        this.hackNetConfig = configuration.hackNet;
        this.globalConfig = configuration.global;
    }

}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("sleep");
    ns.disableLog("getServerMoneyAvailable");
    const purchaser = new HackNetPurchaser(ns);

    while (true) {
        purchaser.purchase();
        await ns.sleep(purchaser.hackNetConfig["sleepTime"] || purchaser.globalConfig["sleepTime"]);
    }

}