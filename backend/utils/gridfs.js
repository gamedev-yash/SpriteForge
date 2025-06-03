const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

let gfs;

function initGridFS(conn) {
    Grid.mongo = mongoose.mongo;
    gfs = Grid(conn.db);
    return gfs;
}

function getGFS() {
    if (!gfs) throw new Error('GridFS not initialized');
    return gfs;
}

// Add this function to your gridfs.js
function deleteFileFromGridFS(filename) {
    const gfs = getGFS();
    return new Promise((resolve, reject) => {
        gfs.remove({ filename }, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = { initGridFS, getGFS, deleteFileFromGridFS };