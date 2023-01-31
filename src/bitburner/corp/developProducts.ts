import { Corporation, NS } from "NetScriptDefinitions";

const fundsMin = (5 * (Math.pow(10, 21)));

export async function developProducts(ns: NS, c: Corporation) {
    while (true) {
        const division = c.getDivision("tobacco");

        const sector12 = c.getOffice(division.name, "Sector-12");


        const productNames = division.products;

        let totalProducts = productNames.length;

        const products = productNames
            .map(p => c.getProduct(division.name, p))
            .filter(p => p.developmentProgress >= 100)
            .sort((a, b) => b.rat - a.rat);

        if (products.length >= 3) {
            const discontinue = products.pop();
            c.discontinueProduct(division.name, discontinue.name);
            totalProducts--;
        }

        if (totalProducts < 3) {
            if (c.getCorporation().funds > fundsMin) {
                const developFunds = c.getCorporation().funds / 4;
                c.makeProduct(division.name, sector12.loc, `t${Math.random()}`, developFunds, developFunds);
            }
        }

        if (c.getCorporation().funds > fundsMin) {
            const advertCost = c.getHireAdVertCost(division.name);
            const officeCost = c.getOfficeSizeUpgradeCost(division.name, sector12.loc, 15);
            ns.print(`advert: ${advertCost <= fundsMin / 2}, office: ${officeCost <= fundsMin / 2}, funds: ${c.getCorporation().funds}, total min: ${fundsMin}, limit: ${fundsMin / 2}`);
            if (officeCost <= fundsMin / 2 || advertCost <= fundsMin / 2) {
                ns.print("office or advert can be purchased");
                if (advertCost < officeCost) {
                    c.hireAdVert(division.name);
                } else {
                    c.upgradeOfficeSize(division.name, sector12.loc, 15);
                    for (let i = 0; i < 15; i++) {
                        c.hireEmployee(division.name, sector12.loc);
                    }
                    const { employees } = c.getOffice(division.name, "Sector-12");

                    let employeesAssigned = 0;
                    const employeeAssignment = Math.round(employees / 7) * 2;
                    c.setAutoJobAssignment(division.name, sector12.loc, "Operations", employeeAssignment);
                    employeesAssigned += employeeAssignment;
                    c.setAutoJobAssignment(division.name, sector12.loc, "Engineer", employeeAssignment);
                    employeesAssigned += employeeAssignment;
                    c.setAutoJobAssignment(division.name, sector12.loc, "Management", employeeAssignment);
                    employeesAssigned += employeeAssignment;
                    c.setAutoJobAssignment(division.name, sector12.loc, "Business", Math.round(employees - employeesAssigned));
                }
            }
        }


        for (const name of c.getConstants().upgradeNames) {
            if (c.getCorporation().funds > fundsMin) {

                const upgradeCost = c.getUpgradeLevelCost(name);
                if (upgradeCost <= fundsMin / 2) {
                    c.levelUpgrade(name);
                }
            }
        }

        ns.print(productNames);

        for (const product of products) {
            if (product.developmentProgress >= 100) {
                c.sellProduct(division.name, sector12.loc, product.name, "MAX", "MP", true);
                c.setProductMarketTA1(division.name, product.name, true);
                c.setProductMarketTA2(division.name, product.name, true);
            }
        }
        await ns.sleep(1000);
    }
}