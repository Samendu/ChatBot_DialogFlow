var express= require('express');
var app=express();

const diaflow = require("dialogflow-fulfillment");
const randomstirng = require("randomstring");

const MongoClient=require('mongodb').MongoClient;
const url="mongodb://127.0.0.1:27017";
const dbname="ComplaintRegistration";

var uname="";
var val = 0;

app.post("/apitodialogflow", express.json(), (req, res) => {
    const agent = new diaflow.WebhookClient({
        request : req,
        response : res
    });

    function accoptions(agent) {
        val = agent.parameters.issue_acc;
        const crusername = agent.parameters.crusername;
        const crpassword = agent.parameters.crpassword;
        const crpassword1 = agent.parameters.crpassword1;
        if(val == 1) {
            MongoClient.connect(url, function(err, db) {
                if(err) {
                    throw err;
                }
                else {
                    var dbo = db.db(dbname);
                    if(crpassword === crpassword1) {
                        dbo.collection("UserDetails").insertOne({username : crusername, password : crpassword}, function(err, res) {
                            if(err) {
                                throw err;
                            }
                            else {
                                agent.add("Account created for username : "+crusername);
                                db.close();
                            }
                        });
                    }
                    else {
                        agent.add("Please enter matching password");
                    }
                }
            });
        }
        else {
            agent.add("Enter username and password : ");
        }
    }
    
    async function userverification(agent) {
        const username = agent.parameters.username;
        const password = agent.parameters.password;
        const client = new MongoClient(url);
        await client.connect();
        const snap = await client.db(dbname).collection("UserDetails").findOne({username : username, password : password});
        
        if(snap == null) {
            await agent.add("Please enter correct username and password");
        }
        else {
            uname = snap.username;
            await agent.add("Welcome "+uname+" How can I help you...");
            var options = {
                "richContent" : [
                    [
                        {
                            "type" : "list",
                            "title" : "Broadband Down",
                            "subtitle" : "Press 1",
                            "event" : {
                                "name" : "",
                                "languageCode" : "",
                                "parameters" : {}
                            }
                        },
                        {
                            "type" : "divider"
                        },
                        {
                            "type" : "list",
                            "title" : "Slow Connection",
                            "subtitle" : "Press 2",
                            "event" : {
                                "name" : "",
                                "languageCode" : "",
                                "parameters" : {}
                            }
                        },
                        {
                            "type" : "divider"
                        },
                        {
                            "type" : "list",
                            "title" : "Voice Down",
                            "subtitle" : "Press 3",
                            "event" : {
                                "name" : "",
                                "languageCode" : "",
                                "parameters" : {}
                            }
                        },
                        {
                            "type" : "divider"
                        },
                        {
                            "type" : "list",
                            "title" : "Installation",
                            "subtitle" : "Press 4",
                            "event" : {
                                "name" : "",
                                "languageCode" : "",
                                "parameters" : {}
                            }
                        },
                    ]
                ]
            }
            agent.add(new diaflow.Payload(agent.UNSPECIFIED, options,{
                sendAsMessage : true,
                rawPayload : true
            }));
        }
    }

    function report(agent) {
        var dict = {1 : "Broadband Down", 2 : "Slow Connection", 3 : "Voice Down", 4 : "Installation"};
        const intent_val = agent.parameters.issue_num;
        var issuetype = dict[intent_val];
        const token = randomstirng.generate(10);

        MongoClient.connect(url, function(err, db) {
            if(err) {
                throw err;
            }
            else {
                var dbo = db.db(dbname);
                
                let td = Date.now();
                let object = new Date(td);
                let year = object.getFullYear();
                let month = object.getMonth()+1;
                let date = object.getDate();
                let time = object.getHours()+":"+object.getMinutes()+":"+object.getSeconds();

                dbo.collection("ComplaintDetails").insertOne({username : uname, status : "open", issue : issuetype, issue_date_time : date+"-"+month+"-"+year+" "+time, token : token}, function(err, res) {
                    if(err) {
                        throw err;
                    }
                    else {
                        db.close();
                    }
                });
            }
        });
        agent.add("Issue reported : "+issuetype);
        agent.add("Token received : "+token);
    }

    var intentMap = new Map();
    
    intentMap.set("ComplaintManager1", accoptions);
    intentMap.set("ComplaintManager1-custom1", userverification);
    intentMap.set("ComplaintManager1-custom1-custom1", report);

    agent.handleRequest(intentMap);

});

app.listen(900,()=>console.log("Starting"));