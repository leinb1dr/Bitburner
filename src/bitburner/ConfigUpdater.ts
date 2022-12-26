import { NS } from "NetScriptDefinitions";

const hackingFiles = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];

/** @param {NS} ns */
export async function main(ns: NS){

    const executables = ns.ls("home");
    ns.print(executables);

    ns.clearPort(2);
    ns.writePort(2, JSON.stringify({
        global: {
            port: 1,
            sleepTime: 1000,
            metrics: 3,
            metricsStorage: 4
        },
        driver: {
            portScripts: executables.filter(x=>hackingFiles.includes(x)).length
        },
        fleetController: {
            minSecurityOffset: 1,
            maxSecurityOffset: 4,
            minMoneyPercentage: 0.6,
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
        },
        hackNet: {
            cpuUpgrade: 1,
            ramUpgrade: 1,
            levelUpgrade: 2,
            fleetSize: 30,
            sleepTime: 100
        },
        gangs: {
            tasks:["Money Laundering", "Money Laundering", "Cyberterrorism"],
            upgradeMulti: 2
        }
    } as Configuration));

}