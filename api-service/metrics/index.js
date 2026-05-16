const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({
    register
});

const jobsProcessed = new client.Counter({
    name: "jobs_processed_total",
    help: "Total processed jobs"
});

register.registerMetric(jobsProcessed);

module.exports = {
    register,
    jobsProcessed
};
