const mongoose = require('mongoose');
let gfsBucket;

function initGridFS(conn) {
    gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'fs' });
    return gfsBucket;
}

function getGFSBucket() {
    if (!gfsBucket) throw new Error('GridFSBucket not initialized');
    return gfsBucket;
}

async function deleteFileFromGridFS(filename) {
    const bucket = getGFSBucket();
    // Find all files with this filename and delete them
    const files = await bucket.find({ filename }).toArray();
    for (const file of files) {
        await bucket.delete(file._id);
    }
}

module.exports = { initGridFS, getGFSBucket, deleteFileFromGridFS };