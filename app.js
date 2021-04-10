var express = require('express');
const cors = require('cors'); // ensure POSTs originated from our users on our site
const bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const helmet = require('helmet'); // added security features
const unsplashRouter = require("./routes/UnsplashRouter");

const rateLimit = require("express-rate-limit");

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
app.enable('trust proxy');
// redirect non https traffic
app.use((req, res, next) => {
    if (req.secure || req.headers.host.includes("127.0.0.1")) {
        next();
    } else {
        res.redirect('https://' + req.headers.host + req.url);
    }
});

const apiLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 25
});

app.use(helmet());
app.use(bodyParser.json()); // convert json data to req.body object in route

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
	next();
});

app.use("/unsplash", apiLimiter, unsplashRouter);

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.engine('html', require('ejs').renderFile);

app.get('/', function(req, res) {
	// index.html minified via http://minifycode.com/html-minifier/
	res.render('index.min.html');
});

// heroku deployments require use of port env var
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);

module.exports = server;