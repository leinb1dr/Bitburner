type GlobalConfig = {
    port: number,
    sleepTime: number,
    metrics: number
    metricsStorage: number
}

type DriverConfig = {
    portScripts: number
}

type FleetControllerConfig = {
    minSecurityOffset: number,
    maxSecurityOffset: number,
    minMoneyPercentage: number,
    maxMoneyPercentage: number,
    personalPrefixes: string[],
    unhackable: string[],
    sleepTime: number
}

type FleetWatchdogConfig = {
    defaultScript: string,
    scripts: string[],
    ratios: number[],
    dependencies: string[],
    blockList: string[]
}

type HackNetConfig = {
    ramUpgrade: number,
    levelToUpgrade: number,
    cpuUpgrade: number,
    fleetSize: number,
    sleepTime: number
}

type GangConfig = {
    tasks: string[],
    sleepTime: number,
    upgradeMulti: number
}

type HWGWConfig={
    port: number,
    sleepTime: number,
    personalPrefixes: string,
    dryRun:boolean,
    blockList: string[],
    scriptDelay: number,
    moneyPercentage: number,
    allowBatching: boolean
}

type PurchaseServerConfig={
    poolSize: number,
    ramExponent: number,
    sleepTime: number,
}

type Configuration = {
    purchaseServer: PurchaseServerConfig,
    global: GlobalConfig,
    driver: DriverConfig,
    fleetController: FleetControllerConfig,
    fleetWatchdog: FleetWatchdogConfig,
    hackNet: HackNetConfig,
    gangs: GangConfig,
    hwgw: HWGWConfig
}