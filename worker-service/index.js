const sharp = require("sharp");
const path = require("path");
const { createClient } = require("redis");

const redisClient = createClient({
    url: "redis://redis:6379"
});

async function processImage(jobData) {

    const inputPath = `/uploads/${jobData.image}`;
    const outputPath = `/processed/resized-${jobData.image}`;

    const start = Date.now();

    await sharp(inputPath)
        .resize(300, 300)
        .jpeg({ quality: 80 })
        .toFile(outputPath);

    const end = Date.now();

    console.log(JSON.stringify({
        service: "worker-service",
        event: "image_processed",
        job_id: jobData.id,
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

        console.log("Received Job:", jobData);

        await processImage(jobData);
    }
}

startWorker();
