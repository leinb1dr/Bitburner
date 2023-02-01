import { Corporation, Division, NS, Office } from "NetScriptDefinitions";

export async function developProducts(ns: NS, c: Corporation) {
    while (true) {
        const { corp, global } = await getPortData(ns);
        const fundsMin = corp.minFunds;
        const investAmount = corp.minFunds / 2;

        for (const divisionName of c.getCorporation().divisions) {

            const division = c.getDivision(divisionName);
            if (!division.makesProducts) {
                continue;
            }
            const sector12 = c.getOffice(division.name, "Sector-12");
            const productNames = division.products;
            let totalProducts = productNames.length;

            const products = productNames
                .map(p => c.getProduct(division.name, p))
                .filter(p => p.developmentProgress >= 100)
                .sort((a, b) => b.rat - a.rat);

            // Discontinue old products
            if (products.length >= 3) {
                const discontinue = products.pop();
                c.discontinueProduct(division.name, discontinue.name);
                totalProducts--;
            }

            // Develop new products
            if (totalProducts < 3) {
                if (c.getCorporation().funds > fundsMin) {
                    const developFunds = c.getCorporation().funds / 4;
                    c.makeProduct(division.name, sector12.loc, `t${Math.random()}`, developFunds, developFunds);
                }
            }

            // Hire more workers
            expandOffice(ns, c, division, sector12, fundsMin, investAmount);



            ns.print(productNames);

            for (const product of products) {
                if (product.developmentProgress >= 100) {
                    if (!product.sCost)
                        c.sellProduct(division.name, sector12.loc, product.name, "MAX", "MP", true);
                    if (c.hasResearched(division.name, "Market-TA.I")) {
                        c.setProductMarketTA1(division.name, product.name, true);
                    }
                    if (c.hasResearched(division.name, "Market-TA.II")) {
                        c.setProductMarketTA2(division.name, product.name, true);
                    }
                }
            }
        }

        for (const name of c.getConstants().upgradeNames) {
            if (c.getCorporation().funds > fundsMin) {

                const upgradeCost = c.getUpgradeLevelCost(name);
                if (upgradeCost <= investAmount) {
                    c.levelUpgrade(name);
                }
            }
        }
        await ns.sleep(corp["sleepTime"] || global["sleepTime"]);
    }
}

function expandOffice(ns: NS, c: Corporation, division: Division, sector12: Office, fundsMin: number, investAmount: number) {
    // Make sure we have enough to justify investment
    if (c.getCorporation().funds > fundsMin) {
        const advertCost = c.getHireAdVertCost(division.name);
        for (const city of division.cities) {
            const office = c.getOffice(division.name, city);
            const officeCost = c.getOfficeSizeUpgradeCost(division.name, office.loc, 15);
            if (office.loc != sector12.loc && office.employees + 60 >= sector12.employees) {
                continue;
            }

            // Ensure we don't over spend
            if (officeCost <= investAmount || advertCost <= investAmount) {

                // Purchase advert if cheaper
                if (advertCost < officeCost) {
                    c.hireAdVert(division.name);
                } else {
                    // Otherwise upgrade office
                    c.upgradeOfficeSize(division.name, office.loc, 15);
                    for (let i = 0; i < 15; i++) {
                        c.hireEmployee(division.name, office.loc);
                    }
                    const { employees } = c.getOffice(division.name, office.loc);
                    if (office.loc === sector12.loc) {
                        const employeeAssignment = Math.round(employees / 7) * 2;
                        c.setAutoJobAssignment(division.name, office.loc, "Operations", employeeAssignment);
                        c.setAutoJobAssignment(division.name, office.loc, "Engineer", employeeAssignment);
                        c.setAutoJobAssignment(division.name, office.loc, "Management", employeeAssignment);
                        c.setAutoJobAssignment(division.name, office.loc, "Business", Math.round(employees - (employeeAssignment * 3)));
                    } else {
                        c.setAutoJobAssignment(division.name, office.loc, "Operations", 1);
                        c.setAutoJobAssignment(division.name, office.loc, "Engineer", 1);
                        c.setAutoJobAssignment(division.name, office.loc, "Management", 1);
                        c.setAutoJobAssignment(division.name, office.loc, "Business", 1);
                        c.setAutoJobAssignment(division.name, office.loc, "Research & Development", employees - 4);

                    }
                }
            }
        }
    }
}

async function getPortData(ns: NS) {
    let configPortValue = "";
    while (configPortValue == "NULL PORT DATA" || configPortValue.length == 0) {
        await ns.sleep(1000);
        configPortValue = ns.peek(2) as string;
    }

    const { corp, global } = JSON.parse(configPortValue) as Configuration;
    return { corp, global };
}