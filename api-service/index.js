const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { createClient } = require("redis");

const app = express();

const redisClient = createClient({
    url: "redis://redis:6379"
});

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

    const job = {
        id: uuidv4(),
        image: req.file.filename,
        task: "resize",
        created_at: new Date()
    };

    await redisClient.lPush("image_jobs", JSON.stringify(job));

    console.log(JSON.stringify({
        service: "api-service",
        event: "job_queued",
        job
    }));

    res.json({
        message: "Image uploaded",
        job
    });
});

app.listen(3000, () => {
    console.log("API Service running on port 3000");
});
