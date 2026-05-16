const sharp = require("sharp");
const express = require("express");
const metricsApp = express();
const path = require("path");
const { createClient } = require("redis");
const mongoose = require("mongoose");
const Job = require("./models/Job");
const redisClient = createClient({
    url: "redis://redis:6379"
});
const log=require("./utils/logger");
const {
    register,
    jobsProcessed
} = require("./metrics");
//const client = require("prom-client");


mongoose.connect("mongodb://mongodb:27017/image_pipeline");

async function processImage(jobData) {

    const inputPath = `/uploads/${jobData.image}`;
    const outputPath = `/processed/resized-${jobData.image}`;

    const start = Date.now();

    await sharp(inputPath)
        .resize(300, 300)
        .jpeg({ quality: 80 })
        .toFile(outputPath);

    const end = Date.now();
    await Job.updateOne(
    	{ job_id: jobData.job_id },
    	{
          status: "completed",
          completed_at: new Date(),
          processing_time_ms: end - start
    	}
    );
    console.log(JSON.stringify({
        service: "worker-service",
        event: "image_processed",
        job_id: jobData.job_id,
        input: inputPath,
        output: outputPath,
        processing_time_ms: end - start
    }));
}

async function startWorker() {

    await redisClient.connect();

    console.log("Worker connected to Redis");

    while (true) {

        const job = await redisClient.brPop("image_jobs", 0);

        const jobData = JSON.parse(job.element);

        console.log(JSON.stringify({
            timestamp: new Date(),
            service: "worker-service",
            event: "job_received",
            job_id: jobData.job_id
        }));
	    await Job.updateOne(
        		{ job_id: jobData.job_id },
        		{
            	status: "processing",
           		started_at: new Date(),
            	worker_id: "worker-1"
        		}
	    );
	    try {
            await processImage(jobData);
            jobsProcessed.inc();
        }
        catch(err) {
            console.log(JSON.stringify({
                timestamp: new Date(),
                service: "worker-service",
                event: "job_failed",
                job_id: jobData.job_id,
                error: err.message
            }));

        await Job.updateOne(
            { job_id: jobData.job_id },
            { status: "failed" }
            );
        }
    }
}

startWorker();

metricsApp.get("/metrics", async (req, res) => {

    res.set("Content-Type", register.contentType);

    res.end(await register.metrics());
});
metricsApp.listen(4000,()=>{
    console.log("Metrics server running on port 4000");
});
