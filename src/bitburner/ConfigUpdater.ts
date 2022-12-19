import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns: NS){
    ns.clearPort(2);
    ns.writePort(2, JSON.stringify({
        global: {
            port: 1,
            sleepTime: 1000,
            metrics: 3,
            metricsStorage: 4
        },
        driver: {
            portScripts: 5
        },
        fleetController: {
            minSecurityOffset: 1,
            maxSecurityOffset: 5,
            minMoneyPercentage: 0.4,
            maxMoneyPercentage: 1,
            personalPrefixes: ["home"],
            unhackable: ["johnson-ortho", "crush-fitness"],
            sleepTime: 1000
        },
        fleetWatchdog: {
            defaultScript: "Weaken",
            scripts: ["Weaken", "Grow", "Hack"],
            ratios: [1, 2, 5],
            dependencies: ["MetricsPublisher.js", "AttackFunctions.js"]
        }
    } as Configuration));

}