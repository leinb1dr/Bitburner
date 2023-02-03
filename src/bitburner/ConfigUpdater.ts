import { NS } from "NetScriptDefinitions";
import { LoggerFactory } from "./utility/Logger";

const hackingFiles = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];

/** @param {NS} ns */
export async function main(ns: NS) {
    LoggerFactory.init(ns);
    const logger = LoggerFactory.newLogger();

    const executables = ns.ls("home");
    logger.info(executables);

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
            scripts: ["Weaken", "Grow", "Hack"],
            blockList: ["home", "n00dles"],
            ratios: [1, 2, 3],
            dependencies: ["MetricsPublisher.js", "AttackFunctions.js"]
        },
        hackNet: {
            cpuUpgrade: 2,
            ramUpgrade: 2,
            levelToUpgrade: 4,
            fleetSize: 10,
            sleepTime: 100
        },
        gangs: {
            tasks: ["Cyberterrorism","Money Laundering","Money Laundering"],
            // tasks: [
            //     //0
            //     "Train Hacking", "Train Hacking",
            //     //2
            //     "Train Hacking", "Train Hacking",
            //     //4
            //     "Cyberterrorism", "Money Laundering",
            //     //6
            //     "Cyberterrorism", "Train Hacking",
            //     //8
            //     "Train Hacking", "Train Hacking",
            //     //10
            //     "Train Hacking", "Train Hacking",
            //     //12
            //     "Train Hacking", "Train Hacking"],
            // tasks:["Train Hacking"],
            upgradeMulti: 1.5
        },
        hwgw: {
            personalPrefixes: "home",
            blockList: ["home"],
            sleepTime: 1000,
            port: 5,
            dryRun: false,
            scriptDelay: 1500,
            moneyPercentage: 1,
            allowBatching: true
        },
        purchaseServer: {
            poolSize: 10,
            ramExponent: 20
            // ramExponent: 128
        },
        corp:{
            minFunds: (1 * (Math.pow(10, 18)))
        }
    } as Configuration));

}