import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { SKIP_THROTTLE } from "../config/throttle";

/**
 * Liveness probe for the container runtime.
 *
 * Deliberately does not touch the database. Docker restarts a container whose
 * healthcheck fails, so if this probe queried Postgres, a brief database blip
 * would kill an otherwise healthy API and turn a recoverable outage into a
 * restart loop. "Is the process serving HTTP?" is the question a liveness check
 * should answer.
 *
 * Throttling is skipped because the healthcheck runs on a fixed interval from
 * the Docker daemon; counting it against the rate limiter would let routine
 * probes eat into a real visitor's budget.
 */
@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @SkipThrottle(SKIP_THROTTLE)
  @ApiOperation({ summary: "Liveness probe" })
  check() {
    return { status: "ok", uptime: Math.round(process.uptime()) };
  }
}
