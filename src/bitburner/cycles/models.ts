export interface WorkerPool {
    threads: number,
    worker: string
}

export interface ValuedTargets {
    target: string,
    maxMoney: number
}

export interface WorkerTargetAssignment {
    worker: string,
    target: string,
    batchProperties: BatchProperties
}

export type BatchProperties = {
    money: number,
    target: string,
    hackThreads: number,
    hackTime: number,
    hackSecurityOffsetThreads: number,
    growThreads: number,
    growTime: number,
    growSecurityOffsetThreads: number,
    weakenTime: number,
    batches: number,
    neededThreads: number,
    batchTiming: BatchTiming
}

export type BatchTiming = {
    hackSleep: number,
    hackSecSleep: number,
    growSleep: number,
    growSecSleep: number,
    batchLength: number
}

export type Allocations = {
    valuableTargets: ValuedTargets[]
    workerPoolCapacity: WorkerPool[],
    workerThreadsAllocated: Map<string, number>,
    workerTargetAssignments:WorkerTargetAssignment[]
}