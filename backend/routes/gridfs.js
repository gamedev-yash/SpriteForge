const express = require('express');
const router = express.Router();
const { getGFSBucket } = require('../utils/gridfs');

router.get('/:filename', async (req, res) => {
    const bucket = getGFSBucket();
    try {
        const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
        downloadStream.on('error', () => res.status(404).json({ error: 'File not found' }));
        downloadStream.pipe(res);
    } catch (err) {
        res.status(404).json({ error: 'File not found' });
    }
});

module.exports = router;