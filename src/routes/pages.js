const express = require('express');
const path = require('path');
const router = express.Router();

const pages = [
    'index',
    'login',
    'profile',
    'myprofile',
    'users',
    'owners',
    'notifications',
    'settings',
    'worklog',
    'print',
    'demo'
];

pages.forEach(page => {
    router.get(`/${page === 'index' ? '' : page}`, (req, res) => {
        res.sendFile(
            path.join(__dirname, '../../public', `${page}.html`) // ✅ FIXED PATH
        );
    });
});

module.exports = router;