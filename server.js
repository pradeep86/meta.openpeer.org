
const PATH = require("path");
const FS = require("fs");
const EXPRESS = require("express");

const PORT = process.env.PORT || 8080;


var serviceUid = false;
if (FS.existsSync(PATH.join(__dirname, "service.json"))) {
    serviceUid = JSON.parse(FS.readFileSync(PATH.join(__dirname, "service.json"))).uid;
}

exports.main = function(callback) {

    var app = EXPRESS();

    app.use(function(req, res, next) {
        if (serviceUid) {
            res.setHeader("x-service-uid", serviceUid);
        }
        var origin = null;
        if (req.headers.origin) {
            origin = req.headers.origin;
        } else
        if (req.headers.host) {
            origin = [
                (PORT === 443) ? "https" : "http",
                "://",
                req.headers.host
            ].join("");
        }
        res.setHeader("Access-Control-Allow-Methods", "GET");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        if (req.method === "OPTIONS") {
            return res.end();
        }
        return next();
    });

    mountStaticDir(app, /^\/(.*(?:\.html)?)?$/, __dirname);

    var server = app.listen(PORT);
    console.log("open http://localhost:" + PORT + "/");

    return callback(null, server);
}

function mountStaticDir(app, route, path) {
    app.get(route, function(req, res, next) {
        var originalUrl = req.url;
        req.url = req.params[0] || "index.html";
        res.setHeader("Content-Type", "text/plain");
        EXPRESS.static(path)(req, res, function() {
            req.url = originalUrl;
            return next.apply(null, arguments);
        });
    });
};


if (require.main === module) {
    exports.main(function(err) {
        if (err) {
            console.error(err.stack);
            process.exit(1);
        }
    });
}
