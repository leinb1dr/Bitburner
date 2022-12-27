import { NS } from "NetScriptDefinitions";

function scriptRam(ns: NS) {
    const ram = Math.ceil(ns.getScriptRam("h.js"));
    ns.print(`Script Ram: ${ram}`);
    return ram;
}

function ramAvailable(ns: NS, source: string) {
    return ns.getServerMaxRam(source) - ns.getServerUsedRam(source);
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("sleep");

    const pids = {};

    const names = (ns.args[0] as string).split(",");
    const source = ns.args[1] as string;
    for (const name of names) {
        pids[name] = 0;
    }

    while (true) {

        for (const name of names) {

            if (!ns.isRunning(pids[name])) {

                await correctSecurity(ns, name, source);
                await correctMoney(ns, name, source);
                await correctSecurity(ns, name, source);

                const moneyToHack = getSupportedAmountToHack(ns, name, source);

                const hackThreads = Math.ceil(ns.hackAnalyzeThreads(name, moneyToHack)),
                    hackTime = Math.ceil(ns.getHackTime(name)),
                    hackSecurity = Math.ceil(ns.hackAnalyzeSecurity(hackThreads, name)),
                    hackSecurityOffsetThreads = Math.ceil((hackThreads * .002) / 0.05),
                    growThreads = Math.ceil(ns.growthAnalyze(name, moneyToHack)),
                    growTime = Math.ceil(ns.getGrowTime(name)),
                    growSecurity = Math.ceil(ns.growthAnalyzeSecurity(growThreads, name)),
                    growSecurityOffsetThreads = Math.ceil((growThreads * .004) / 0.05),
                    weakenTime = Math.ceil(ns.getWeakenTime(name));

                ns.print(`
------------------------------------
Hack:
	threads/time/sec = ${hackThreads}/${hackTime}/${hackSecurity}
Weaken:
	threads/time = ${hackSecurityOffsetThreads}/${weakenTime}
Grow:
	threads/time/sec = ${growThreads}/${growTime}/${growSecurity}
Weaken:
	threads/time = ${growSecurityOffsetThreads}/${weakenTime}
                `);

                const scriptDelay = 500;
                const hackSleep = weakenTime - hackTime + (scriptDelay * 0);
                const hackSecSleep = weakenTime - weakenTime + (scriptDelay * 1);
                const growSecSleep = weakenTime - weakenTime + (scriptDelay * 3);
                const growSleep = weakenTime - growTime + (scriptDelay * 2);

                const startOffset = 100;

                const now = Date.now();
                const hackSecStart = now + hackSecSleep + startOffset;
                const growSecStart = now + growSecSleep + startOffset;
                const growStart = now + growSleep + startOffset;
                const hackStart = now + hackSleep + startOffset;

                ns.print(`
HackSec starts at ${hackSecStart} ends at ${hackSecStart + weakenTime}
GrowSec starts at ${growSecStart} ends at ${growSecStart + weakenTime}
Grow    starts at ${growStart} ends at ${growStart + growTime}
Hack	starts at ${hackStart} ends at ${hackStart + hackTime}
	            `);

                ns.exec("h.js", source, hackThreads, name, hackStart);
                ns.exec("w.js", source, hackSecurityOffsetThreads, name, hackSecStart);
                ns.exec("g.js", source, growThreads, name, growStart);
                pids[name] = ns.exec("w.js", source, growSecurityOffsetThreads, name, growSecStart);
            }
        }

        await ns.sleep(1000);
    }
}

async function correctSecurity(ns: NS, name: string, source: string) {

    let secDiff = ns.getServerSecurityLevel(name) - ns.getServerMinSecurityLevel(name);
    while (secDiff > 0) {
        let threads = Math.ceil(secDiff / 0.05);

        if (threads * scriptRam(ns) > ramAvailable(ns, source)) {
            threads = ramAvailable(ns, source) / scriptRam(ns);
        }

        ns.print("Security is off or next run fixing");
        const correctSecPid = ns.exec("w.js", source, threads, name, 0);
        while (ns.isRunning(correctSecPid)) {
            await ns.sleep(100);
        }
        secDiff = ns.getServerSecurityLevel(name) - ns.getServerMinSecurityLevel(name);
        await ns.sleep(100);

    }
}

async function correctMoney(ns: NS, name: string, source: string) {
    let moneyDiff = ns.getServerMaxMoney(name) - ns.getServerMoneyAvailable(name);
    while (moneyDiff > 0) {
        let threads = Math.ceil(ns.growthAnalyze(name, moneyDiff));

        if (threads * scriptRam(ns) > ramAvailable(ns, source)) {
            threads = ramAvailable(ns, source) / scriptRam(ns);
        }

        ns.print("Money is off or next run fixing");
        const fixMoneyPid = ns.exec("g.js", source, threads, name, 0);
        while (ns.isRunning(fixMoneyPid)) {
            await ns.sleep(100);
        }
        moneyDiff = ns.getServerMaxMoney(name) - ns.getServerMoneyAvailable(name);
        await ns.sleep(100);
    }
}

function getSupportedAmountToHack(ns: NS, name: string, source: string) {
    let maxMoney = ns.getServerMaxMoney(name);
    let minMoney = 0;   
    let moneyToHack = maxMoney;
    const serverRam = ramAvailable(ns, source);

    while (minMoney < maxMoney) {
        ns.print(`Checking to hack $${moneyToHack}`);
        const hackThreads = Math.ceil(ns.hackAnalyzeThreads(name, moneyToHack)),
            hackSecurityOffsetThreads = Math.ceil((hackThreads * .002) / 0.05),
            growThreads = Math.ceil(ns.growthAnalyze(name, moneyToHack)),
            growSecurityOffsetThreads = Math.ceil((growThreads * .004) / 0.05);
        const neededRam = (hackThreads + hackSecurityOffsetThreads + growThreads + growSecurityOffsetThreads) * scriptRam(ns);
        ns.print(`Ram needed / Ram Available ${neededRam}/${serverRam}`);
        if (neededRam > serverRam) {
            maxMoney = moneyToHack;
            moneyToHack = ((maxMoney - minMoney) / 2) + minMoney;
        } else if (neededRam < serverRam){
            minMoney = moneyToHack;
            moneyToHack = ((maxMoney - minMoney) / 2) + minMoney;
        } else {
            return moneyToHack;
        }
    }
    return moneyToHack;
}
