const express = require('express');
const router = express.Router();
const { getGFS } = require('../utils/gridfs');

router.get('/:filename', (req, res) => {
    const gfs = getGFS();
    const readstream = gfs.createReadStream({ filename: req.params.filename });
    readstream.on('error', err => {
        res.status(404).json({ error: 'File not found' });
    });
    readstream.pipe(res);
});

module.exports = router;