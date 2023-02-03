import { NetscriptPort, NS } from "NetScriptDefinitions";

export class HackSupport {
    private ns: NS;
    private portHandle: NetscriptPort;

    static HWGW_PORT = 5;


    constructor(ns: NS) {
        this.ns = ns;
        this.portHandle = ns.getPortHandle(2);
    }

    public async getConfiguration(): Promise<Configuration> {
        while (this.portHandle.empty()) {
            await this.ns.sleep(100);
        }

        return JSON.parse(this.portHandle.peek() as string) as Configuration;
    }

    private myMoney(): number {
        return this.ns.getServerMoneyAvailable("home");
    }

    public hasMoney(cost: number): boolean {
        return this.myMoney() >= cost;
    }

    public async waitForMoney(cost: number) {
        while (!this.hasMoney(cost))
            await this.ns.sleep(1000);
    }
}