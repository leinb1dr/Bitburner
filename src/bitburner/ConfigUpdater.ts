import { NS } from "NetScriptDefinitions";

const hackingFiles = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];

/** @param {NS} ns */
export async function main(ns: NS) {

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
            portScripts: executables.filter(x => hackingFiles.includes(x)).length
        },
        fleetController: {
            minSecurityOffset: 0,
            maxSecurityOffset: 1,
            minMoneyPercentage: 0.6,
            maxMoneyPercentage: 1,
            personalPrefixes: ["home"],
            unhackable: ["n00dles"],
            sleepTime: 1000
        },
        fleetWatchdog: {
            defaultScript: "Weaken",
            // scripts: ["Weaken", "Grow", "Hack"],
            scripts:["Weaken", "Weaken", "Weaken"],
            blockList: ["home","n00dles"],
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
            tasks: ["Money Laundering"],
            // tasks: ["Ethical Hacking"],
            upgradeMulti: 1.5
        },
        hwgw: {
            personalPrefixes: "home",
            blockList: ["home"],
            sleepTime: 1000,
            port: 5,
            dryRun: false,
            scriptDelay: 500
        }
    } as Configuration));

}