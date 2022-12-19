import { NS } from "NetScriptDefinitions";
// import { reportHack, reportGrow, reportWeaken } from "./MetricsPublisher";

export async function doHack(ns: NS, globalConfig: GlobalConfig, scriptTargets: Targets, threads: number) {
    const list = scriptTargets.Hack;
    const hackTarget = list[getRandomInt(list.length)];
    // const start = Date.now();
    await ns.hack(hackTarget, { threads: threads });
    // const duration = Date.now() - start;

    // reportHack(ns, globalConfig["metrics"], hackTarget, money, duration)
}


export async function doGrow(ns: NS, globalConfig: GlobalConfig, scriptTargets: Targets, threads: number) {
    const list = scriptTargets.Grow;
    const hackTarget = list[getRandomInt(list.length)];
    // const start = Date.now();
    await ns.grow(hackTarget, { threads: threads });
    // const duration = Date.now() - start;

    // reportGrow(ns, globalConfig["metrics"], hackTarget, multiplier, duration)
}

export async function doWeaken(ns: NS, globalConfig: GlobalConfig, scriptTargets: Targets, threads: number) {
    const list = scriptTargets.Weaken;
    const hackTarget = list[getRandomInt(list.length)];
    // const start = Date.now();
    await ns.weaken(hackTarget, { threads: threads });
    // const duration = Date.now() - start;

    // reportWeaken(ns, globalConfig["metrics"], hackTarget, amount, duration)
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}