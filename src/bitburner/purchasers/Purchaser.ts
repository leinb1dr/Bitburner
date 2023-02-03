import { NS } from "NetScriptDefinitions";
import { HackNetPurchaser } from "purchasers/PurchaseHackNet";
import { ServerPurchaser } from "purchasers/PurchaseServers";

export class Purchaser{

    ns:NS;
    hackNet:HackNetPurchaser;
    servers:ServerPurchaser;

    constructor(ns:NS){
        this.ns = ns;
        this.hackNet = new HackNetPurchaser(ns);
        this.servers = new ServerPurchaser(ns);
    }

    public async purchase(){
        //this.ns.print("Starting hacknet purchase");
        await this.hackNet.purchase();
        //this.ns.print("Starting server purchase");
        await this.servers.purchase();
    }
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL");
    ns.enableLog("exec");
    const cycler = new Purchaser(ns);

    while (true) {
        await cycler.purchase();
        //safty sleep
        await ns.sleep(1000);
    }
}