const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const validator = require('validator');

const Datastore = require('nedb');
var users = new Datastore({ filename: 'db/users.db', autoload: true });
var messages = new Datastore({ filename: path.join(__dirname, 'db', 'messages.db'), autoload: true, timestampData: true });

var Message = function (content, username) {
    this.content = content;
    this.username = username;
    this.upvote = 0;
    this.downvote = 0;
}

const cookie = require('cookie');

const session = require('express-session');
app.use(session({
    secret: 'mylonglonglongsecretisworth$525$',
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, sameSite: true, secure: true } //cookie flags
}));

function generateSalt() {
    return crypto.randomBytes(16).toString('base64');
}

function generateHash(password, salt) {
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    return hash.digest('base64');
}

app.use(function (req, res, next) {
    var username = (req.session.username) ? req.session.username : '';
    res.setHeader('Set-Cookie', cookie.serialize('username', username, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week in number of seconds
        httpOnly: true,
        sameSite: true,
        secure: true
    }));
    next();
});

app.use(express.static('static'));

app.use(function (req, res, next) {
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

var isAuthenticated = function (req, res, next) {
    if (!req.session.username) return res.status(401).end("access denied");
    next();
};

//Functions to validate the input
var checkUsername = function (req, res, next) {
    if (!validator.isAlphanumeric(req.body.username)) return res.status(400).end("user name not alphanumeric");
    next();
};

var checkPassword = function (req, res, next) {
    if (!validator.isLength(req.body.password, { min: 8 })) return res.status(400).end("password not long enough");
    next();
};

var sanitizeContent = function (req, res, next) {
    req.body.content = validator.escape(req.body.content);
    next();
};

var checkId = function (req, res, next) {
    if (!validator.isAlphanumeric(req.params.id)) return res.status(400).end("id not alphanumeric");
    next();
};
// curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signup/
app.post('/signup/', checkUsername, checkPassword, function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    users.findOne({ _id: username }, function (err, user) {
        if (err) return res.status(500).end(err);
        if (user) return res.status(409).end("username " + username + " already exists");
        var salt = generateSalt();
        var hash = generateHash(password, salt);
        users.update({ _id: username }, { _id: username, salt, hash }, { upsert: true }, function (err) {
            if (err) return res.status(500).end(err);
            return res.json("user " + username + " signed up");
        });
    });
});

// curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signin/
app.post('/signin/', checkUsername, checkPassword, function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    // retrieve user from the database
    users.findOne({ _id: username }, function (err, user) {
        if (err) return res.status(500).end(err);
        if (!user) return res.status(401).end("access denied");
        if (user.hash !== generateHash(password, user.salt)) return res.status(401).end("access denied"); // invalid password
        // start a session
        req.session.username = user._id;
        res.setHeader('Set-Cookie', cookie.serialize('username', user._id, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
        }));
        return res.json("user " + username + " signed in");
    });
});

// curl -b cookie.txt -c cookie.txt localhost:3000/signout/
app.get('/signout/', function (req, res, next) {
    req.session.destroy();
    res.setHeader('Set-Cookie', cookie.serialize('username', '', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    res.redirect('/');
});

// curl -b cookie.txt -H "Content-Type: application/json" -X POST -d '{"content":"hello world!"}' localhost:3000/api/messages/
app.post('/api/messages/', sanitizeContent, isAuthenticated, function (req, res, next) {
    var message = new Message(req.body.content, req.session.username);
    messages.insert(message, function (err, message) {
        if (err) return res.status(500).end(err);
        return res.json(message);
    });
});

// curl -b cookie.txt localhost:3000/api/messages/
app.get('/api/messages/', function (req, res, next) {
    messages.find({}).sort({ createdAt: -1 }).limit(8).exec(function (err, messages) {
        if (err) return res.status(500).end(err);
        return res.json(messages.reverse());
    });
});

// curl -b cookie.txt -H "Content-Type: application/json" -X PATCH -d '{"action":"upvote"}' localhost:3000/api/messages/a66mKb0o3pnnYig4/
app.patch('/api/messages/:id/', checkId, isAuthenticated, function (req, res, next) {
    if (['upvote', 'downvote'].indexOf(req.body.action) == -1) return res.status(400).end("unknown action" + req.body.action);
    messages.findOne({ _id: req.params.id }, function (err, message) {
        if (err) return res.status(500).end(err);
        if (!message) return res.status(404).end("Message id #" + req.params.id + " does not exists");
        var update = {};
        message[req.body.action] += 1;
        update[req.body.action] = 1;
        messages.update({ _id: message._id }, { $inc: update }, { multi: false }, function (err, num) {
            res.json(message);
        });
    });
});

// curl -b cookie.txt -X DELETE localhost:3000/api/messages/a66mKb0o3pnnYig4/
app.delete('/api/messages/:id/', isAuthenticated, checkId, function (req, res, next) {
    messages.findOne({ _id: req.params.id }, function (err, message) {
        if (err) return res.status(500).end(err);
        if (!message) return res.status(404).end("Message id #" + req.params.id + " does not exists");
        if (message.username !== req.session.username) return res.status(403).end("forbidden");
        messages.remove({ _id: message._id }, { multi: false }, function (err, num) {
            res.json(message);
        });
    });
});

const https = require('https');
const PORT = 3000;

var privateKey = fs.readFileSync('server.key');
var certificate = fs.readFileSync('server.crt');
var config = {
    key: privateKey,
    cert: certificate
};

https.createServer(config, app).listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTPS server on https://localhost:%s", PORT);
});
