import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns: NS){
    ns.clearPort(2);
    ns.writePort(2, JSON.stringify(createConfig));

}

function createConfig(): Configuration{
    return {
        global: {
            port: 1,
            sleepTime: 1000,
            metrics: 3,
            metricsStorage: 4
        },
        driver: {
            portScripts: 3
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
            defaultScript: "weaken",
            scripts: ["weaken", "grow", "hack"],
            ratios: [1, 2, 7],
            dependencies: ["metricsReporter.js", "attackFunctions.js"]
        }
    };
}