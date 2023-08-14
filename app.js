const http = require('http')
const https = require('https')
const express = require('express')
const fs = require('fs')
const url = require('url')
const crypto = require('crypto')

const app = express()

process.on('uncaughtException', (error, origin) => {
    console.log('----- Uncaught exception -----')
    console.log(error)
    console.log('----- Exception origin -----')
    console.log(origin)
})

process.on('unhandledRejection', (reason, promise) => {
    console.log('----- Unhandled Rejection at -----')
    console.log(promise)
    console.log('----- Reason -----')
    console.log(reason)
})


if(!fs.existsSync('repo')) fs.mkdirSync('repo')
if(!fs.existsSync('repo/admin')) fs.mkdirSync('repo/admin')
if(!fs.existsSync('repo/admin/deposit')) fs.mkdirSync('repo/admin/deposit')
if(!fs.existsSync('repo/admin/pub')) fs.mkdirSync('repo/admin/pub')
if(!fs.existsSync('repo/admin/notices')) fs.mkdirSync('repo/admin/notices')
if(!fs.existsSync('repo/admin/notices/trusted')) fs.mkdirSync('repo/admin/notices/trusted')
if(!fs.existsSync('repo/admin/notices/purgatory')) fs.mkdirSync('repo/admin/notices/purgatory')
if(!fs.existsSync('repo/admin/notices/banlist')) fs.writeFileSync('repo/admin/notices/banlist', '')
if(!fs.existsSync('repo/admin/notices/ipbanlist')) fs.writeFileSync('repo/admin/notices/ipbanlist', '')
if(!fs.existsSync('repo/admin/notices/trustlist')) fs.writeFileSync('repo/admin/notices/trustlist', '')

function inList(str, strlistx){
    var arr = strlistx.toString().split('\n')

    for(var i = 0; i < arr.length; i++){
        if(str === arr[i]){
            return 1
        }
    }

    return 0

}

app.get('/postmailping', (request, response) => {
    response.writeHead(200)
    response.end("postmailpong")
})

app.get('/getinfo', (request, response) => {

    //common pub files to use: "bio" - user's bio (text)
    //                         "name" - user's complete (user)name, supports spaces and symbols
    //                         "pgp" - user's public pgp key (armored)
    //                         "pfp" - user's profile picture (in a PNG format)
    //                         "at"  - alternate addresses in JSON (email, phone, social media, etc)
    //                         "status" - user's current status
    //                         "site" - website
    //                         "reusme" - resume 

    var reqfile = "repo/" + request.query.user + "/pub/" + request.query.file

    if(fs.existsSync(reqfile)){
        response.download(reqfile)
    }else{
        response.writeHead(404)
        response.end()
    }
})

app.get('/sendnotice', (request, response) => {

    var noticeIsValid = false

    if(request.query.user === null || request.query.sender === null || request.query.token === null || request.query.id === null){
        response.writeHead(404)
        response.end()
    }
    if(request.query.user.length > 256 || request.query.sender.length > 256 || request.query.token.length > 256 || request.query.id.length > 256){
        response.writeHead(404)
        response.end()
    }

    var notice = {
        'user': request.query.user,
        'sender': request.query.sender,
        'token': request.query.token,
        'id': request.query.id
    }

    var userFolder = "repo/" + notice.user + "/"
    var purgatoryDir = userFolder + "/notices/purgatory/" + notice.sender
    var trustedDir = userFolder + "/notices/trusted/"
    var senderUser = notice.sender.split(':')[0]
    var senderHost = notice.sender.split(':')[1]
    var confReqArgs = "/checkrepo?user=" + senderUser + "&id=" + notice.id + "&token=" + notice.token

    var confirmationReqOpts = { //request for sender server to confirm authenticity
        hostname: senderHost,
        port: 27050,
        path: confReqArgs,
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
    }

    var trustlist = fs.readFileSync(userFolder + "/notices/trustlist")
    var banlist = fs.readFileSync(userFolder + "/notices/banlist")
    var ipbanlist = fs.readFileSync(userFolder + "/notices/ipbanlist")

    var confirmationReq = http.get(confirmationReqOpts, (confirmationRes) => {
        
        //Contact presumed sender's server to certify authenticity of message

        confirmationRes.on('data', function(chunk){
            var d = chunk + "\0"
            if(d === "yes!\0"){
                console.log("VALID NOTICE" + JSON.stringify(notice))

                //if sender confirmed authenticity of mail
                noticeIsValid = true

            }else{
                console.log("INVALID NOTICE" + JSON.stringify(notice))
                noticeIsValid = false
                response.writeHead(404)
                response.end()
                return
            }

            if(noticeIsValid){
                if(inList(notice.sender, banlist) || inList(senderHost, ipbanlist)){

                    //IF BANNED

                    response.writeHead(200)
                    response.end("ban")
                    console.log("USER BANNED, NOTICE NOT RECEIVED")
                    return //return false confirm, but do not store noticefile
                }

                if(!inList(notice.sender, trustlist)){ 

                    //if not in the trust list

                    if(!fs.existsSync(purgatoryDir))
                        fs.mkdirSync(purgatoryDir)

                    var noticeAmm = fs.readdirSync(purgatoryDir).length

                    if(noticeAmm > 5){ //if more than 5 mails sent by user end up in purgatory
                        response.writeHead(200)
                        response.end('purglim')
                        console.log("PURGATORY LIMIT REACHED FOR " + notice.sender)
                        return //return false, but do not store noticefile
                    }

                    var fileName = purgatoryDir + "/" + Math.floor(new Date() / 1000) + "~" + notice.sender

                    fs.writeFileSync(fileName, JSON.stringify(notice))

                    response.writeHead(200)
                    response.end("ok")
                    return
                }

                if(inList(notice.sender, trustlist)){

                    //IF TRUSTED

                    if(!fs.existsSync(trustedDir))
                        fs.mkdirSync(trustedDir)

                    var filename = trustedDir + "/" + Math.floor(new Date() / 1000) + "~" + notice.sender

                    fs.writeFileSync(filename, JSON.stringify(notice))

                    response.writeHead(200)
                    response.end("ok")
                    return

                }
            }
        })
    })

    console.log("---")
})

app.get('/checkrepo', (request, response) => {
    var fileName = "repo/" + request.query.user + "/deposit/" + request.query.id
    var token = request.query.token

    if(fs.existsSync(fileName)){
        var authlist = fs.readFileSync(fileName + "/auth")
        if(inList(token, authlist)){
            response.writeHead(200)
            response.end('yes!')
            return
        }
    }

    response.writeHead(200)
    response.end('no')
    return
})

app.get('/get', (request, response) => {
    var fileName = "repo/" + request.query.user + "/deposit/" + request.query.id
    var token = request.query.token

    if(fs.existsSync(fileName)){
        var authlist = fs.readFileSync(fileName + "/auth")
        var actFileNameStr = fs.readFileSync(fileName + "/meta")
        var actFileName = JSON.parse(actFileNameStr).filename
        var persistStatus = JSON.parse(actFileNameStr).persist
        if(inList(token, authlist)){
            console.log("serving file " + actFileName + "\n")
            response.download(fileName + "/" + actFileName)
            if(persistStatus !== 'true'){
                var newAuthlist = authlist.toString().replace(token + '\n', '')
                fs.writeFileSync(fileName + "/auth", newAuthlist)

                if(newAuthlist.replace('\n', '') === "")
                    console.log("FILE " + request.query.id + " HAS BEEN DELIVERED TO EVERYONE")

            }
            
            return
        }
    }

    response.writeHead(200)
    response.end('no')
    return
})


const server = http.createServer(app)
server.listen(27050)