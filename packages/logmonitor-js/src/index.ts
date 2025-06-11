type LogLevel = "log" | "info" | "warn" | "error" | "debug";

interface LogPayload {
    level: LogLevel;
    message: string;
    clientTimestamp: number;
    logUserId?: string;
    payload?: any[];
}

class Logmonitor {
    private static instance: Logmonitor;

    private _apiKey?: string;
    private _logUserId?: string;
    private _isInitialized = false;
    private _isProduction = process.env.NODE_ENV === "production";

    private _logBuffer: LogPayload[] = [];
    private _batchIntervalId?: ReturnType<typeof setInterval>;
    private _originalConsole: Record<LogLevel, (...args: any[]) => void> = {} as any;

    private static readonly ENDPOINT = "https://aromatic-duck-387.convex.site/api/v1/logs";
    private static readonly BATCH_PERIOD = 15 * 1000; // 15 seconds
    private static readonly MAX_BATCH_SIZE = 20;

    // Singleton pattern
    public static getInstance(): Logmonitor {
        if (!Logmonitor.instance) {
            Logmonitor.instance = new Logmonitor();
        }
        return Logmonitor.instance;
    }

    public init({ apiKey }: { apiKey: string }): void {
        if (this._isInitialized) {
            console.warn("Logmonitor is already initialized.");
            return;
        }
        this._apiKey = apiKey;
        this._isInitialized = true;

        // --- The Magic Switch ---
        // Only patch console and send logs in production environments.
        if (this._isProduction) {
            this.patchConsole();
            this.startBatchTimer();
            // Flush logs when the user navigates away
            window.addEventListener("beforeunload", this.sendLogs);
        }
    }

    public setUser({ userId }: { userId: string }): void {
        this._logUserId = userId;
    }

    public clearUser(): void {
        this._logUserId = undefined;
    }

    public dispose(): void {
        if (!this._isInitialized) return;

        // Restore original console methods
        this.unpatchConsole();

        // Clear timers and listeners
        if (this._batchIntervalId) {
            clearInterval(this._batchIntervalId);
        }
        window.removeEventListener("beforeunload", this.sendLogs);

        // Send any final logs
        this.sendLogs();

        // Reset state
        this._isInitialized = false;
        this._apiKey = undefined;
    }

    private patchConsole(): void {
        const levels: LogLevel[] = ["log", "info", "warn", "error", "debug"];
        levels.forEach((level) => {
            // Store the original method
            this._originalConsole[level] = console[level];
            // Overwrite it
            console[level] = (...args: any[]) => {
                // Call the original method so logs still appear in the browser console
                this._originalConsole[level](...args);
                // Add the log to our buffer
                this.addLog(level, args);
            };
        });
    }

    private unpatchConsole(): void {
        Object.entries(this._originalConsole).forEach(([level, originalMethod]) => {
            console[level as LogLevel] = originalMethod;
        });
    }

    private addLog(level: LogLevel, args: any[]): void {
        // Simple message formatting
        const message = args
            .map((arg) => {
                if (typeof arg === "object") return JSON.stringify(arg, null, 2);
                return String(arg);
            })
            .join(" ");

        this._logBuffer.push({
            level,
            message,
            clientTimestamp: Date.now(),
            logUserId: this._logUserId,
            payload: args, // Send the raw arguments as payload
        });

        if (this._logBuffer.length >= Logmonitor.MAX_BATCH_SIZE) {
            this.sendLogs();
        }
    }

    private startBatchTimer(): void {
        this._batchIntervalId = setInterval(() => {
            if (this._logBuffer.length > 0) {
                this.sendLogs();
            }
        }, Logmonitor.BATCH_PERIOD);
    }

    // Use an arrow function to preserve `this` context for event listeners
    private sendLogs = async (): Promise<void> => {
        if (!this._apiKey || this._logBuffer.length === 0) return;

        const batchToSend = [...this._logBuffer];
        this._logBuffer = []; // Clear buffer immediately

        try {
            const response = await fetch(Logmonitor.ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Logmonitor-Api-Key": this._apiKey,
                },
                body: JSON.stringify(batchToSend),
                keepalive: true, // Important for `beforeunload`
            });

            if (response.status !== 202) {
                // On failure, add logs back to the buffer for the next attempt
                this._logBuffer.unshift(...batchToSend);
            }
        } catch (error) {
            this._logBuffer.unshift(...batchToSend);
        }
    };
}

// Export a single instance for easy use
export const logmonitor = Logmonitor.getInstance();