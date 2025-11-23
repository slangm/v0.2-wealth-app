import { Injectable } from "@nestjs/common";
import type { LegalDocSlug } from "@globalwealth/content";
import { getLegalDoc } from "@globalwealth/content";

type Holding = {
  id: string;
  name: string;
  symbol: string;
  allocationPct: number;
  value: number;
  dayChangePct: number;
  region: string;
};

type PortfolioSnapshot = {
  securityBalance: number;
  growthBalance: number;
  holdings: Holding[];
  currency: string;
  monthlyExpenses: number;
};

const holdings: Holding[] = [
  {
    id: "spy",
    name: "S&P 500 ETF",
    symbol: "SPY",
    allocationPct: 0.45,
    value: 22450,
    dayChangePct: 1.2,
    region: "US",
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    allocationPct: 0.3,
    value: 38240,
    dayChangePct: 4.5,
    region: "On-chain",
  },
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    allocationPct: 0.15,
    value: 28450,
    dayChangePct: 2.1,
    region: "On-chain",
  },
  {
    id: "openai",
    name: "OpenAI Fund",
    symbol: "OAI",
    allocationPct: 0.1,
    value: 15000,
    dayChangePct: 15.4,
    region: "Private",
  },
];

const boosts = [
  {
    id: "auto-save",
    label: "Auto Saver",
    delta: 2.0,
    description: "Recurring deposit each payday",
    active: true,
  },
  {
    id: "education",
    label: "Learning sprint",
    delta: 2.0,
    description: "Completed 2 literacy modules",
    active: true,
  },
  {
    id: "referrals",
    label: "Invite friends",
    delta: 0.5,
    description: "2 referral streak",
    active: true,
  },
];

export type PortfolioTargets = {
  safePct: number;
  growthPct: number;
  updatedAt: string;
};

export type DeploymentStatus =
  | "AWAIT_BRIDGE"
  | "BASE_EXEC"
  | "BRIDGING"
  | "POLYGON_READY"
  | "POLY_EXEC"
  | "DONE"
  | "FAILED";

export type DeploymentJob = {
  id: string;
  userId: string;
  safePct: number;
  growthPct: number;
  status: DeploymentStatus;
  logs: string[];
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class PortfolioService {
  private readonly targets = new Map<string, PortfolioTargets>(); // userId -> targets
  private readonly jobs = new Map<string, DeploymentJob>();

  constructor() {
    // simple in-memory state machine tick
    setInterval(() => this.tickJobs(), 5000);
  }

  getSnapshot(): PortfolioSnapshot {
    return {
      securityBalance: 8240,
      growthBalance: 4605,
      holdings,
      currency: "USD",
      monthlyExpenses: 1200,
    };
  }

  getBoosts() {
    return boosts;
  }

  recordAllocation(amount: number, target: "protected" | "growth") {
    return {
      amount,
      target,
      status: "queued",
    };
  }

  fetchLegalDoc(slug: LegalDocSlug, locale?: string) {
    return {
      slug,
      locale: locale ?? "en-US",
      content: getLegalDoc(slug, locale),
    };
  }

  setTargets(userId: string, safePct: number, growthPct: number) {
    const total = Number(safePct) + Number(growthPct);
    if (Math.abs(total - 1) > 0.01) {
      throw new Error("Safe + Growth must be ~100%");
    }
    const record: PortfolioTargets = {
      safePct,
      growthPct,
      updatedAt: new Date().toISOString(),
    };
    this.targets.set(userId, record);
    return record;
  }

  getTargets(userId: string) {
    return this.targets.get(userId) ?? null;
  }

  createDeploymentJob(userId: string, safePct: number, growthPct: number) {
    const now = new Date().toISOString();
    const job: DeploymentJob = {
      id: `job_${Date.now()}_${this.jobs.size + 1}`,
      userId,
      safePct,
      growthPct,
      status: "AWAIT_BRIDGE",
      logs: [
        "Job created. Awaiting bridge from Safe wallet (Base Sepolia) to Growth wallet (Base Sepolia).",
      ],
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  listJobsForUser(userId: string) {
    return Array.from(this.jobs.values()).filter(
      (job) => job.userId === userId
    );
  }

  getJob(jobId: string) {
    return this.jobs.get(jobId) ?? null;
  }

  private tickJobs() {
    const active = Array.from(this.jobs.values()).filter(
      (job) =>
        !["DONE", "FAILED"].includes(job.status) &&
        !["AWAIT_BRIDGE", "BRIDGING", "POLYGON_READY"].includes(job.status)
    );
    for (const job of active) {
      const next = this.nextStatus(job.status);
      if (!next) continue;
      job.status = next;
      job.updatedAt = new Date().toISOString();
      job.logs.unshift(this.logForStatus(next));
      if (job.logs.length > 20) job.logs.pop();
      this.jobs.set(job.id, job);
    }
  }

  private nextStatus(status: DeploymentStatus): DeploymentStatus | null {
    switch (status) {
      case "BASE_EXEC":
        return "BASE_EXEC";
      case "POLY_EXEC":
        return "DONE";
      default:
        return null;
    }
  }

  private logForStatus(status: DeploymentStatus) {
    const now = new Date().toISOString();
    const messages: Record<DeploymentStatus, string> = {
      AWAIT_BRIDGE: `${now} AWAIT_BRIDGE: user must bridge funds Safe(Base Sepolia) -> Growth(Base Sepolia)`,
      BASE_EXEC: `${now} BASE_EXEC: internal tasks after bridge (optional)`,
      BRIDGING: `${now} BRIDGING: waiting for Base Sepolia arrival`,
      POLYGON_READY: `${now} POLYGON_READY: funds detected on Base Sepolia`,
      POLY_EXEC: `${now} POLY_EXEC: swapping and depositing into Growth vault`,
      DONE: `${now} DONE: deployment completed`,
      FAILED: `${now} FAILED: deployment failed`,
    };
    return messages[status];
  }
}
