import { Allocator } from "cycles/Allocator";
import { FleetScheduler } from "cycles/FleetScheduler";
import { NS } from "NetScriptDefinitions";



export class Cycler{
    private allocator: Allocator;
    private scheduler: FleetScheduler;

    constructor(ns:NS){
        this.allocator = new Allocator(ns);
        this.scheduler = new FleetScheduler(ns);
    }

    async run(){
        await this.allocator.allocate();
        await this.scheduler.schedule();
    }

}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL");
    ns.enableLog("exec");
    const cycler = new Cycler(ns);

    while (true) {
        await cycler.run();
        //safty sleep
        await ns.sleep(1000);
    }
}