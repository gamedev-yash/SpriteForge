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

module.exports = { initGridFS, getGFS };