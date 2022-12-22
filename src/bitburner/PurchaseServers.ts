import { NS } from "NetScriptDefinitions";

function myMoney(ns: NS) {
    return ns.getServerMoneyAvailable("home");
}

async function waitForMoney(ns: NS, cost: number) {
    while (myMoney(ns) < cost) {
        ns.print(`Need $${cost}. Have $${myMoney(ns)}`);
        await ns.sleep(1000);
    }
}

/** @param {NS} ns */
export async function main(ns: NS) {
    
    while(ns.getPurchasedServers().length < 25){
        const cost = ns.getPurchasedServerCost(2);
        await waitForMoney(ns, cost);
        ns.purchaseServer("home", 2);
    }

    for(let i = 2; 1<=20; i++){
        for(let j = 0; j < ns.getPurchasedServers().length; j++){
            const cost = ns.getPurchasedServerUpgradeCost(`home-${j}`, Math.pow(2, i));
            await waitForMoney(ns, cost);
            ns.upgradePurchasedServer(`home-${0}`, Math.pow(2, i));
        }
    }

}