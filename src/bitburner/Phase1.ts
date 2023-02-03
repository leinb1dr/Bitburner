import { NS } from "NetScriptDefinitions";
import { Cycler } from "cycles/Cycler";
import { Nuker } from "Nuker";
import { Purchaser } from "purchasers/Purchaser";
import { LoggerFactory } from "./utility/Logger";

class Phase1{
    ns:NS;
    cycler: Cycler;
    purchaser: Purchaser;
    nuker: Nuker;
    x = 100;
    logger = LoggerFactory.newLogger();

    constructor(ns:NS){
        this.ns = ns;
        this.cycler = new Cycler(ns);
        this.purchaser = new Purchaser(ns);
        this.nuker = new Nuker(ns);
    }

    public async run(){
        this.x++;
		if (this.x > 10) {
            this.logger.info("Updating config port");
			this.ns.exec("ConfigUpdater.js", "home");
			this.x = 0;
		}
        await this.nuker.nuke();
        await this.purchaser.purchase();
        await this.cycler.run();
        this.logger.info("Finished run");  
    }
}

/** @param {NS} ns */
export async function main(ns: NS) {
    LoggerFactory.init(ns);
    ns.disableLog("ALL");
    const phase1 = new Phase1(ns);

    while (true) {
        await phase1.run();
        //safty sleep
        await ns.sleep(1000);
    }
}


