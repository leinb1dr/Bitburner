import { NS } from "NetScriptDefinitions";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.tail();
    const { corporation } = ns;

    while (true) {
        const info = corporation.getCorporation();
        const divisionNames = info.divisions;
        ns.print(divisionNames);
        for (const divisionName of divisionNames) {
            const division = corporation.getDivision(divisionName);
            for (const cityName of division.cities) {
                ns.print(cityName);
                const office = corporation.getOffice(divisionName, cityName);

                ns.print(office);
                if (office.avgEne < 95) {
                    corporation.buyCoffee(divisionName, cityName);
                }
                if (office.avgHap < 95) {
                    corporation.throwParty(divisionName, cityName, 1_000_000);
                }
            }
        }
        await ns.sleep(1000);


    }

}