const express = require("express");
const { createClient } = require("redis");

const app = express();

app.use(express.json());

const redisClient = createClient({
    url: "redis://redis:6379"
});

redisClient.connect();

app.post("/job", async (req, res) => {

    const job = {
        id: Date.now(),
        task: "resize-image",
        image: "sample.png"
    };

    await redisClient.lPush("image_jobs", JSON.stringify(job));

    console.log("Job pushed:", job);

    res.json({
        message: "Job queued",
        job
    });
});

app.listen(3000, () => {
    console.log("API Service running on port 3000");
});
