const url = require('url');
const fs = require('fs');
const path = require('path');
const qs = require('querystring');
const formidable = require('formidable');
const cats = require("../../data/cats");

function readFile(filePath, res, catBreedPlaceholder) {
    const reader = fs.createReadStream(filePath);
    reader.on('data', (data) => {
        if (catBreedPlaceholder === undefined) {
            res.write(data);
            return;
        }
        let modifiedData = data.toString().replace('{{catBreeds}}', catBreedPlaceholder);
        res.write(modifiedData);
    });
    reader.on('end', () => {
        res.end();
    });
    reader.on('error', (err) => {
        console.log(err);
    });
}


module.exports = (req, res) => {
    const pathname = url.parse(req.url).pathname;

    if (pathname === '/cats/add-cat' && req.method === 'GET') {
        const breeds = require('../../data/breeds');
        let filePath = path.normalize(path.join(__dirname, '../../views/addCat.html'));
        let catBreedPlaceholder = breeds.map((breed) => `<option value="${breed}">${breed}</option>`);
        readFile(filePath, res, catBreedPlaceholder);
    } else if (pathname === '/cats/add-breed' && req.method === 'GET') {
        let filePath = path.normalize(path.join(__dirname, '../../views/addBreed.html'));
        readFile(filePath, res);
    } else if (pathname === '/cats/add-breed' && req.method === 'POST') {
        let formData = '';

        req.on('data', (data) => {
            formData += data;
        });

        req.on('end', () => {
            let body = qs.parse(formData);
            fs.readFile('./data/breeds.json', (err, data) => {
                if (err) {
                    console.log(err);
                    return err;
                }
                let breeds = JSON.parse(data);
                breeds.push(body.breed);
                let json = JSON.stringify(breeds);

                fs.writeFile('./data/breeds.json', json, 'utf-8', () => console.log('Breed successfully added!'));
            });

            res.writeHead(301, {Location: '/'});
            res.end();
        })

    } else if (pathname === '/cats/add-cat' && req.method === 'POST') {
        let form = new formidable.IncomingForm();

        form.parse(req, (err, fields, files) => {
            if (err) {
                return err;
            }
            let oldPath = files.upload.path;
            let newPath = path.normalize(path.join(__dirname, '../../content/images/' + files.upload.name));

            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    return err;
                }
                console.log('File was uploaded successfully!');
            });

            fs.readFile('./data/cats.json', 'utf-8', (err, data) => {
                if (err) {
                    return err;
                }

                let allCats = JSON.parse(data);
                allCats.push({id: cats.length + 1, ...fields, image: files.upload.name});
                let json = JSON.stringify(allCats);
                fs.writeFile('./data/cats.json', json, () => {
                    res.writeHead(301, {Location: '/'});
                    res.end();
                });
            });
        });

    } else if (pathname.includes('/cats-edit') && req.method === 'GET') {
        const cats = require('../../data/cats');
        const breeds = require('../../data/breeds');
        let filePath = path.normalize(path.join(__dirname, '../../views/editCat.html'));
        let catId = +pathname.substring(pathname.lastIndexOf('/') + 1);
        let cat = cats[catId - 1];
        const reader = fs.createReadStream(filePath);
        reader.on('data', (data) => {
            let modifiedData = data.toString().replace('{{id}}', catId);
            modifiedData = modifiedData.replace('{{name}}', cat.name);
            modifiedData = modifiedData.replace('{{description}}', cat.description);

            const breedsAsOptions = breeds.map((b) => `<option value="${b}">${b}</option>`);
            modifiedData = modifiedData.replace('{{catBreeds', breedsAsOptions.join('/'));
            modifiedData = modifiedData.replace('{{breed}}', cat.breed);
            res.write(modifiedData);
        });
        reader.on('end', () => {
            res.end();
        });
        reader.on('error', (err) => {
            console.log(err);
        });

    } else if (pathname.includes('/cats-edit') && req.method === 'POST') {
        let form = new formidable.IncomingForm();

        form.parse(req, (err, fields, files) => {
            if (err) {
                return err;
            }
            let oldPath = files.upload.path;
            let newPath = path.normalize(path.join(__dirname, '../../content/images/' + files.upload.name));

            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    return err;
                }
                console.log('File was uploaded successfully!');
            });

            fs.readFile('./data/cats.json', 'utf-8', (err, data) => {
                if (err) {
                    return err;
                }
                let catId = +pathname.substring(pathname.lastIndexOf('/') + 1);
                let allCats = JSON.parse(data);
                allCats.filter((cat) => cat.id === catId).forEach(cat => {
                    cat.name = fields.name;
                    cat.description = fields.description;
                    cat.image = files.upload.name;
                    cat.breed = fields.breed;
                });
                let json = JSON.stringify(allCats);
                fs.writeFile('./data/cats.json', json, () => {
                    res.writeHead(301, {Location: '/'});
                    res.end();
                });
            });
        });
    } else if (pathname.includes('/cats-find-new-home') && req.method === 'GET') {
        const cats = require('../../data/cats');
        let filePath = path.normalize(path.join(__dirname, '../../views/catShelter.html'));
        let catId = +pathname.substring(pathname.lastIndexOf('/') + 1);
        let cat = cats[catId - 1];
        console.log(pathname);
        const reader = fs.createReadStream(filePath);
        reader.on('data', (data) => {
            let modifiedData = data.toString().replace('{{image}}', path.join('./content/images/' + cat.image));
            modifiedData = modifiedData.replace('{{id}}', catId);
            modifiedData = modifiedData.replace('{{name}}', cat.name);
            modifiedData = modifiedData.replace('{{description}}', cat.description);
            modifiedData = modifiedData.replace('{{breed}}', cat.breed);
            res.write(modifiedData);
        });
        reader.on('end', () => {
            res.end();
        });
        reader.on('error', (err) => {
            console.log(err);
        });
    } else if (pathname.includes('/cats-find-new-home') && req.method === 'POST') {
        fs.readFile('./data/cats.json', 'utf-8', (err, data) => {
            if (err) {
                console.log(err);
                return err;
            }
            let catId = +pathname.substring(pathname.lastIndexOf('/') + 1);
            let cats = JSON.parse(data);
            cats = cats.filter((cat) => cat.id !== catId);
            let json = JSON.stringify(cats);

            fs.writeFile('./data/cats.json', json, 'utf-8', () => {
                console.log('Cat successfully deleted!');
                res.writeHead(301, {Location: '/'});
                res.end();
            });
        });
    } else {
        return true;
    }
};


