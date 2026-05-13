const { createClient } = require("redis");

const redisClient = createClient({
    url: "redis://redis:6379"
});

async function startWorker() {

    await redisClient.connect();

    console.log("Worker connected to Redis");

    while (true) {

        const job = await redisClient.brPop("image_jobs", 0);

        console.log("Received Job:");
        console.log(JSON.parse(job.element));
    }
}

startWorker();
