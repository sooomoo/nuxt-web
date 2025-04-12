
export interface RetryStrategy {
    /// Get the next duration in the series.
    next(): number

    /// Reset the backoff to its initial state.
    reset(): void
}

export class ExponentialRetryStrategy implements RetryStrategy {
    readonly initial: number
    readonly maximumStep: number

    constructor(initial: number, maximumStep: number) {
        this.initial = initial
        this.maximumStep = maximumStep
        this.currentDur = initial
        this.currentStep = 1
    }

    private currentStep: number = 1
    private currentDur: number

    next(): number {
        const backoff = this.currentDur
        this.currentStep++
        if (this.maximumStep > this.currentStep) this.currentDur = this.currentDur * 2
        return backoff
    }
    reset(): void {
        this.currentDur = this.initial
        this.currentStep = 1
    }
}

export class ConstantRetryStrategy implements RetryStrategy {
    readonly duration: number
    constructor(duration: number) {
        this.duration = duration
    }
    next(): number {
        return this.duration
    }
    reset(): void { }
}

export class FixedRetryStrategy implements RetryStrategy {
    readonly durations: number[]
    readonly maxStep: number
    constructor(durations: number[]) {
        console.assert(durations.length > 0, "durations cannot be empty")
        this.durations = durations
        this.maxStep = this.durations.length - 1
        this.step = 1
        this.current = durations[0]
    }

    private step: number
    private current: number

    next(): number {
        const backoff = this.current;
        this.step += 1;
        const idx = this.step >= this.maxStep ? this.maxStep : this.step;
        this.current = this.durations[idx];
        return backoff;
    }
    reset(): void {
        this.step = 1
        this.current = this.durations[0]
    }
}