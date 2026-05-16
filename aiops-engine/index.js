const { createClient } = require("redis");

const redisClient = createClient({
    url: "redis://redis:6379"
});

async function monitorSystem() {

    await redisClient.connect();

    console.log("AIOps Engine Connected");

    setInterval(async () => {

        const resizeQueue =
            await redisClient.lLen("resize_jobs");

        const compressionQueue =
            await redisClient.lLen("compression_jobs");

        const aiQueue =
            await redisClient.lLen("ai_jobs");

        console.log({
            resizeQueue,
            compressionQueue,
            aiQueue
        });
        
        let decision = "normal";

        let reason = [];

        if (aiQueue > 5) {

            decision = "prioritize_resize_jobs";

            reason.push(
                "ai_queue_overloaded"
            );
        }

        if (resizeQueue > 10) {

            decision = "scale_resize_workers";

            reason.push(
                "resize_queue_growth"
            );
        }

        console.log(JSON.stringify({

            timestamp: new Date(),

            service: "aiops-engine",

            decision,

            reason,

            metrics: {
                resizeQueue,
                compressionQueue,
                aiQueue
            }

        }));
    }, 5000);
}

monitorSystem();

