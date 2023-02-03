/* eslint-disable @typescript-eslint/no-explicit-any */
import { NetscriptPort, NS } from "NetScriptDefinitions";

type SleepFunction = (millis: number) => Promise<true>;
type PrintFunction = (...args: any[]) => void

class LogConsumer {
    private sleep: SleepFunction;
    private portHandle: NetscriptPort;
    private print: PrintFunction;

    constructor(ns: NS) {
        this.print = ns.print.bind(ns);
        this.sleep = ns.sleep.bind(ns);
        this.portHandle = ns.getPortHandle(6);
    }

    async run() {
        while (true) {
            while (this.portHandle.empty()) await this.sleep(100);
            this.print(this.portHandle.read());
        }
    }
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL");
    const logConsumer = new LogConsumer(ns);

    await logConsumer.run();
}