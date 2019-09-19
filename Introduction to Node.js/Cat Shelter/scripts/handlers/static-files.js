const url = require('url');
const fs = require('fs');

function getContentType(url) {

    if (url.endsWith('css')) {
        return 'text/css';
    } else if (url.endsWith('js')) {
        return 'text/javascript';
    } else if (url.endsWith('html')) {
        return 'text/html';
    } else if (url.endsWith('png')) {
        return 'image/png'
    } else if (url.endsWith('jpg')) {
        return 'image/jpg'
    } else if (url.endsWith('jpeg')) {
        return 'image/jpeg'
    }
    return 'text/plain';
}

function readFile(pathname, res, format) {
    fs.readFile(`./${pathname}`, format, (err, data) => {
        if (err) {
            res.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            res.write('Error reading file');
            res.end();
            return;
        }
        res.writeHead(200, {
            'Content-Type': getContentType(pathname)
        });
        res.write(data);
        res.end();
    });
}

module.exports = (req, res) => {
    const pathname = url.parse(req.url).pathname;

    if (pathname.startsWith('/content') && req.method === 'GET') {
        if (pathname.endsWith('png') || pathname.endsWith('jpg') || pathname.endsWith('jpeg') || pathname.endsWith('ico')) {
            readFile(pathname, res);
        } else {
            readFile(pathname, res, 'utf-8');
        }

    } else {
        return true;
    }
};