const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({

    job_id: String,

    image: String,

    status: {
        type: String,
        enum: ["queued", "processing", "completed", "failed"],
        default: "queued"
    },

    created_at: {
        type: Date,
        default: Date.now
    },

    started_at: Date,

    completed_at: Date,

    processing_time_ms: Number,

    output_image: String
});

module.exports = mongoose.model("Job", JobSchema);
