import prometheus from 'prom-client';

const register = new prometheus.Registry();

prometheus.collectDefaultMetrics({ register });

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});
register.registerMetric(httpRequestDuration);

const taskRunsTotal = new prometheus.Counter({
  name: 'task_runs_total',
  help: 'Total number of scheduled task executions',
  labelNames: ['status'],
});
register.registerMetric(taskRunsTotal);

const taskExecutionDuration = new prometheus.Histogram({
  name: 'task_execution_duration_seconds',
  help: 'Duration of scheduled task executions in seconds',
  labelNames: ['task_id'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});
register.registerMetric(taskExecutionDuration);

const loginAttemptsTotal = new prometheus.Counter({
  name: 'login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status'],
});
register.registerMetric(loginAttemptsTotal);

const opencodeHealthGauge = new prometheus.Gauge({
  name: 'opencode_health_status',
  help: 'OpenCode core health status (1 = healthy, 0 = unhealthy)',
});
register.registerMetric(opencodeHealthGauge);

export async function getMetrics() {
  return register.metrics();
}

export function observeHttpRequest(method, route, statusCode, durationMs) {
  httpRequestDuration.observe(
    { method, route, status: String(statusCode) },
    durationMs / 1000,
  );
}

export function recordTaskRun(status) {
  taskRunsTotal.inc({ status });
}

export function observeTaskExecution(taskId, durationMs) {
  taskExecutionDuration.observe({ task_id: taskId }, durationMs / 1000);
}

export function recordLoginAttempt(success) {
  loginAttemptsTotal.inc({ status: success ? 'success' : 'failure' });
}

export function setOpencodeHealth(healthy) {
  opencodeHealthGauge.set(healthy ? 1 : 0);
}

export { register };
