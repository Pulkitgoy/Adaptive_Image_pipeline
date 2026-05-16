const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { createClient } = require("redis");
const mongoose = require("mongoose");
const app = express();
const Job = require("./models/Job");
const log = require("./utils/logger");

const redisClient = createClient({
    url: "redis://redis:6379"
});

mongoose.connect("mongodb://mongodb:27017/image_pipeline");
redisClient.connect();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "/uploads");
    },

    filename: function (req, file, cb) {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

app.post("/upload", upload.single("image"), async (req, res) => {
    const type = req.query.type || "resize";
    const queueMap = {
        resize: "resize_jobs",
        compress: "compression_jobs",
        ai: "ai_jobs"
    };
    const job = {
        job_id: uuidv4(),
        image: req.file.filename,
        type,
        task: "queued",
        created_at: new Date()
    };
    await Job.create(job);
    const queueName = queueMap[type];
    await redisClient.lPush(queueName, JSON.stringify(job));

    log({
        service: "api-service",
        event: "job_queued",
        job_id: job.job_id,
        image: job.image,
        status: "queued"
    });

    res.json({
        message: "Image uploaded",
        job
    });
});

app.get("/job/:id", async (req, res) => {

    const job = await Job.findOne({
        job_id: req.params.id
    });

    if (!job) {
        return res.status(404).json({
            error: "Job not found"
        });
    }

    res.json(job);
});

app.listen(3000, () => {
    console.log("API Service running on port 3000");
});
