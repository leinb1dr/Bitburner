import { NS } from "NetScriptDefinitions";

function myMoney(ns: NS) {
    return ns.getServerMoneyAvailable("home");
}

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("sleep");
    const gang = ns.gang;
    const equiptment = gang.getEquipmentNames().filter(equiptment => {
        ns.print(`${equiptment}:${gang.getEquipmentType(equiptment)}`);
        return gang.getEquipmentType(equiptment) === "Rootkit" || gang.getEquipmentType(equiptment) === "Augmentation";
    });

    ns.print(`[${equiptment}] equiptment for hackers`);

    while (true) {
        let target = ns.peek(2) as string;
        while (target == "NULL PORT DATA" || target.length == 0) {
            await ns.sleep(1000);
            target = ns.peek(2) as string;
        }

        const config = JSON.parse(target) as Configuration;
        const gangConfig = config.gangs;
        const globalConfig = config.global;
        gang.getMemberNames().forEach((element, i) => {
            ns.print(`Checking on ${element}`);
            const member = gang.getMemberInformation(element);

            const task = gangConfig.tasks[i % gangConfig.tasks.length];
            if (member.hack < 1000) {
                gang.setMemberTask(member.name, "Train Hacking");
            } else {
                gang.setMemberTask(member.name, task);
            }

            const ascention = gang.getAscensionResult(member.name);
            if (ascention && ((ascention.hack >= gangConfig.upgradeMulti) || (ascention.cha >= gangConfig.upgradeMulti))) {
                if (gang.ascendMember(member.name)) {
                    ns.print(`${member.name} ascended`);
                }
            }

            equiptment.forEach(equiptment => {
                if (member.upgrades.indexOf(equiptment) === -1) {
                    if (myMoney(ns) >= gang.getEquipmentCost(equiptment)) {
                        if (gang.purchaseEquipment(member.name, equiptment)) {
                            ns.print(`${member.name} got ${equiptment}`);
                        }
                    }
                }
            });
        });

        if (gang.canRecruitMember()) {
            gang.recruitMember(`member-${gang.getMemberNames().length}`);
        }

        await ns.sleep(gangConfig.sleepTime || globalConfig.sleepTime);
    }


}