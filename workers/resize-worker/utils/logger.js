function log(data) {

    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        ...data
    }));
}

module.exports = log;
