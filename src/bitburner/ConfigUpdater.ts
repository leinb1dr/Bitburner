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
            minSecurityOffset: 1,
            maxSecurityOffset: 3,
            minMoneyPercentage: 0.6,
            maxMoneyPercentage: 1,
            personalPrefixes: ["home"],
            unhackable: ["n00dles"],
            sleepTime: 1000
        },
        fleetWatchdog: {
            defaultScript: "Weaken",
            // scripts: ["Weaken", "Grow", "Hack"],
            scripts:["Weaken", "Grow", "Hack"],
            blockList: ["home","n00dles"],
            ratios: [1, 2, 3],
            dependencies: ["MetricsPublisher.js", "AttackFunctions.js"]
        },
        hackNet: {
            cpuUpgrade: 1,
            ramUpgrade: 1,
            levelToUpgrade: 2,
            fleetSize: 10,
            sleepTime: 100
        },
        gangs: {
            // tasks: ["Money Laundering"],
            tasks: [
                //0
                "Money Laundering","Money Laundering",
                //2
                "Money Laundering","Money Laundering",
                //4
                "Money Laundering","Cyberterrorism",
                //6
                "Money Laundering","Money Laundering",
                //8
                "Cyberterrorism","Cyberterrorism",
                //10
                "Money Laundering","Cyberterrorism"],
            // tasks:["Train Hacking"],
            upgradeMulti: 1.5
        },
        hwgw: {
            personalPrefixes: "home",
            blockList: ["home"],
            sleepTime: 1000,
            port: 5,
            dryRun: false,
            scriptDelay: 1000,
            moneyPercentage: 1,
            allowBatching: false
        },
        purchaseServer:{
            poolSize: 10,
            ramExponent: 8
        }
    } as Configuration));

}