// use require for node vice es6 import / package.json type: 'module'
const express = require("express");
const router = express.Router();
const { createApi } = require("unsplash-js");
const nodeFetch = require("node-fetch");
var sanitizer = require("string-sanitizer");
const {pool} = require('../config');

// API key stored in https://dashboard.heroku.com/ config settings,
// or locally in environment variable
const unsplash = createApi({
        accessKey: process.env.UNSPLASH_ACCESS_KEY,
        fetch: nodeFetch,
});

// this endpoint serves as a proxy to access unsplash search
// allowing us to hide our access key server side
router.post("/image", (req, res, next) => {
    if(req.body.hasOwnProperty('search-term'))
    {
        const query = sanitizer.sanitize.keepSpace(req.body['search-term'])
                        .trim().toLowerCase();

        // check the database cache first
        pool.query('SELECT * FROM images where query = $1', [query], (db_err, db_res) => {  
            if (db_err || (db_res.rows[0] == undefined)) {
                console.log(db_err ? db_err : query + " not found in cache, requesting...");

                // not found in cache
                unsplash.search.getPhotos({ 
                    query, 
                    orientation: 'landscape',
                    page: 1,
                    perPage: 30, // max
                    contentFilter: 'high',
                    orderBy: 'relevant'
                    }).then((result) => {
                        const images = result.response.results;
                        resp = {}
                        resp['api-valid'] = true;
                        resp['images'] = images;

                        if(images.length > 0)
                        {
                            // update cache with response
                            pool.query('INSERT INTO images(query, response) VALUES($1, $2)', [query, resp], (db_err2, db_res2) => { 
                                if (db_err2) {
                                    console.log(db_err2)
                                }
                            });
                        }
                        
                        res.send(resp);
                    })
                    .catch((error) => {
                        console.log(error)
                        // fall into here if we exceed our api limits
                        res.status(500).send({'api-valid' : false});
                    });
            }
            else { // found in cache
                res.send(db_res.rows[0].response);
            }
        });

    }
    else
    {
        res.status(400).send();
    }
});

router.post("/download", (req, res, next) => {
    if(req.body.hasOwnProperty('image'))
    {
        unsplash.photos.trackDownload({
            downloadLocation: req.body.image,
          }).then((result) => {
                res.send(result.response);
            })
            .catch((error) => {
                res.status(500).send(error);
            });
    }
    else
    {
        res.status(400).send();
    }
});

module.exports = router;