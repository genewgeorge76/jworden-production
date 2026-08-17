# jworden-redis — self-hosted Redis on Fly

Celery broker and result backend for `jworden-api`, plus the app's cache client.

## Why this exists

This replaced Upstash, whose free tier was fully exhausted:

```
max requests limit exceeded. Limit: 500000, Usage: 500000
```

That was not a spike. A Celery worker polls its broker continuously and beat
fires roughly 20,000 scheduled tasks a month, so the ceiling was structurally
unreachable — measured at idle immediately after cutover, this instance handled
about 56 commands/minute, which is ~2.4M/month. A 500,000/month allowance is
consumed in about six days at that rate, so any reset would simply have
re-exhausted.

A machine we own has no per-command meter. Cost is roughly **$2/month**
(shared-cpu-1x/256MB ≈ $1.94, plus a 1 GB volume ≈ $0.15).

## Shape

- **Private only.** No `[[services]]` block, no public IP. Reachable exclusively
  over Fly's per-organisation 6PN network at `jworden-redis.internal:6379`.
  Nothing on the public internet can open a socket to it.
- **Password required** as defence in depth, since 6PN is shared by every app in
  the org. Stored as the Fly secret `REDIS_PASSWORD` on the `jworden-redis` app.
- **Persistent.** AOF on a 1 GB volume mounted at `/data`. The broker is a queue;
  a lost queue is lost work.
- **`maxmemory-policy noeviction`.** Never evict on a broker. Eviction silently
  drops queued tasks and the loss is invisible. Failing the write loudly is
  strictly better. Capped at 192 MB on a 256 MB machine.

## The `sh -c` in the process command is deliberate

Fly exec's `[processes]` commands **directly — there is no shell**. Writing
`--requirepass $REDIS_PASSWORD` bare would pass the literal 16-character string
`$REDIS_PASSWORD` to redis-server. Worse, had the variable been empty, Redis
would have consumed the *next flag* as the password and started with an
attacker-guessable one.

Invoking `sh -c` explicitly is what makes the expansion happen. This is the same
class of bug that took the API down when gunicorn was handed `${PORT:` as a port
number — see the comment in the root `fly.toml`.

The generated password is alphanumeric-only so it needs no quoting and cannot be
re-split by the shell.

## Rebuild from scratch

```bash
fly apps create jworden-redis --org personal
fly volumes create redis_data -a jworden-redis -r iad -n 1 -s 1
fly secrets set REDIS_PASSWORD="$(python3 -c '
import secrets,string
a=string.ascii_letters+string.digits
print("".join(secrets.choice(a) for _ in range(40)))')" -a jworden-redis --stage
fly deploy -c infra/redis/fly.toml -a jworden-redis
```

Then point the API at it — all three, since the codebase reads `REDIS_URL` in 39
places, `CELERY_BROKER_URL` in 7 and `CELERY_RESULT_BACKEND` in 2:

```bash
URL="redis://:<password>@jworden-redis.internal:6379/0"
fly secrets set REDIS_URL="$URL" CELERY_BROKER_URL="$URL" \
                CELERY_RESULT_BACKEND="$URL" -a jworden-api
```

A secrets update restarts running machines but **does not start stopped ones** —
if the worker died earlier it needs `fly machine start <id> -a jworden-api`.

## Verifying

```bash
# auth must be enforced — this must print NOAUTH
fly ssh console -a jworden-redis -C "redis-cli -h 127.0.0.1 PING"

# and the real password must work
fly ssh console -a jworden-redis -C "redis-cli -h 127.0.0.1 -a <pw> PING"

# confirm the safety-critical settings actually applied
fly ssh console -a jworden-redis -C \
  "redis-cli -h 127.0.0.1 -a <pw> CONFIG GET maxmemory maxmemory-policy appendonly dir"
```

Healthy cutover looks like this in `fly logs -a jworden-api`:

```
Connected to redis://:**@jworden-redis.internal:6379/0
celery@<machine> ready.
Self-heal cycle complete: status=healthy   ... redis: {ok: True, latency_ms: 16.75}
```

## Rotating the password

Fly secrets are write-only — the value cannot be read back. To rotate, generate a
new one, set it on `jworden-redis`, redeploy that app, then update the three
secrets on `jworden-api`. Expect a brief window where the worker retries its
broker connection.
