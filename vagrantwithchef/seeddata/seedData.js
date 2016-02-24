var fs = require('fs');
var mongodb = require('mongodb');
var exit = require('exit');
var request = require('request'),
    url = require('url');
var request = require('request');
var MongoClient = mongodb.MongoClient;
var teamArr = [];
var role = [];
var request = request.defaults({
    jar: true
});


fs.readFile(process.argv[2], 'utf8', function(err, data) {
    fileData = JSON.parse(data);
    var urlstring = fileData.catalystURL + "auth/signin";
    var parsedurl = url.parse(urlstring);
    var options = {
        port: (parsedurl.port || 3001), // 80 by default
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        form: {
            username: "superadmin",
            pass: "superadmin@123"
        }
    };
    request.post({
        url: fileData.catalystURL + 'auth/signin',
        form: {
            username: 'superadmin',
            pass: 'superadmin@123'
        }
    }, function(err, httpResponse, body) {
        if (err) {
            console.log("Unable to read data from file:", err);
        } else {
            orgDBdata(fileData, function(err, orgData) {
                if (err) {
                    console.log("Error in fetching orgdata from mongodb::", err);
                }
                chefDbData(orgData, fileData, function(err, chefData) {
                    if (err) {
                        console.log("Error in fetching chefdata from mongodb::", err);
                    }
                    projDbData(orgData, fileData, function(err, projData) {
                        if (err) {
                            console.log("Error in fetching projData from mongodb::", err);
                        }
                        for (var i = 0; i < fileData.envNames.length; i++) {
                            var envName = fileData.envNames[i];
                            envDbData(orgData, projData, chefData, envName, fileData, function(err, envData) {
                                if (err) {
                                    console.log("Error in env db data:", err);
                                }
                                createChefEnv(envData.environmentname, chefData, function(err, chefEnvData) {
                                    if (err) {
                                        console.log(err);
                                    };
                                    findInDb('d4dmastersnew', {
                                        id: "3",
                                        orgname: fileData.orgname
                                    }, function(err, envData) {
                                        if (err) {
                                            callback(err, null);
                                            return;
                                        }
                                        var envNameArr = '';
                                        var envIdArr = '';
                                        for (var l = 0; l < envData.length; l++) {
                                            envNameArr = envNameArr + envData[l].environmentname + ',';
                                            envIdArr = envIdArr + envData[l].rowid + ',';
                                        };
                                        console.log(envNameArr, envIdArr);
                                        updateInDb('d4dmastersnew', {
                                            id: '4',
                                            projectname: fileData.project
                                        }, {
                                            "$set": {
                                                environmentname: envNameArr,
                                                environmentname_rowid: envIdArr
                                            }
                                        }, function(err, result) {
                                            if (err) {
                                                console.log("Error in updateing projectdb data:", err);
                                            }
                                        })
                                    })
                                })
                            })
                        };
                        (function(chefData) {
                            tempTypeDbData(function(err, tempTypedata) {
                                if (err) {
                                    console.log(err);
                                };
                                for (var i = 0; i < tempTypedata.length; i++) {
                                    for (var k = 0; k < fileData.tempJson.length; k++) {
                                        if (tempTypedata[i].templatetypename === fileData.tempJson[k].tempType) {
                                            var tempType = fileData.tempJson[k].tempType;
                                            for (var j = 0; j < fileData.tempJson[k].name.length; j++) {
                                                var cookbookIcon = fileData.tempJson[k].cookbookicon[j];
                                                var cookbook = fileData.tempJson[k].cookbooks[j]
                                                var tempfiles = fileData.tempJson[k].tempfiles[j];
                                                var tempName = fileData.tempJson[k].name[j];
                                                var tempfilesPath = fileData.tempJson[k].tempFilespath;
                                                var cookbookImagepath = fileData.tempJson[k].cookbookImagepath;
                                                tempDbData(orgData, chefData, tempName, tempType, cookbookIcon, cookbook, tempfiles, tempfilesPath, cookbookImagepath, fileData, function(err, tempData) {
                                                    if (err) {
                                                        console.log("Error:::", err);
                                                    };
                                                })
                                            }
                                        }
                                    }
                                }
                            })
                        })(chefData);
                        for (var i = 0; i < fileData.teams.length; i++) {
                            var teamName = fileData.teams[i].teamname;
                            var teamUser = fileData.teams[i];
                            var userroleName = fileData.teams[i].userrole;
                            (function(teamName, userroleName, teamUser) {
                                teamDbData(orgData, projData, teamName, fileData, function(err, teamData) {
                                    if (err) {
                                        console.log("Error:::::", err);
                                    };
                                    userroleDbData(function(err, roleData) {
                                        if (err) {
                                            console.log("Error::", err);
                                        };
                                        for (var j = 0; j < roleData.length; j++) {
                                            if (userroleName === roleData[j].userrolename) {
                                                if (teamData.teamname === teamName) {
                                                    for (var l = 0; l < teamUser.user.length; l++) {
                                                        var userName = fileData.teams[j].user[l];
                                                        var userRoleData = roleData[j];
                                                        userDbData(orgData, userName, teamData, userRoleData, fileData, function(err, userData) {
                                                            if (err) {
                                                                console.log(err)
                                                            };
                                                        })
                                                    }
                                                };
                                            };
                                        };
                                    })
                                })
                            })(teamName, userroleName, teamUser);
                        };
                        for (var i = 0; i < fileData.teams.length; i++) {
                            var teamName = fileData.teams[i].teamname;
                            (function(teamName) {
                                findInDb('d4dmastersnew', {
                                    id: '7',
                                    teamname: teamName
                                }, function(err, userData) {
                                    if (err) {
                                        callback(err, null);
                                        return;
                                    }
                                    var usernameArr = '';
                                    var userIdArr = '';
                                    for (var j = 0; j < userData.length; j++) {
                                        usernameArr = usernameArr + userData[j].loginname + ',';
                                        userIdArr = userIdArr + userData[j].rowid + ',';
                                    };
                                    updateInDb('d4dmastersnew', {
                                        id: '21',
                                        teamname: teamName
                                    }, {
                                        "$set": {
                                            loginname: usernameArr,
                                            loginname_rowid: userIdArr
                                        }
                                    }, function(err, result) {
                                        if (err) {
                                            console.log("Error in updateing projectdb data:", err);
                                        }
                                    })
                                })
                            })(teamName);
                        };
                        for (var i = 0; i < fileData.trackDetail.length; i++) {
                            var trackType = fileData.trackDetail[i].trackdatatype;
                            var trackName = fileData.trackDetail[i].trackdataname;
                            var trackUrl = fileData.trackDetail[i].trackdataurl;
                            var childArr = [];
                            for (var j = 0; j < fileData.trackDetail[i].childDetail.length; j++) {
                                childArr.push(fileData.trackDetail[i].childDetail[j]);
                            };
                            console.log(trackType, trackName, trackUrl, childArr);
                            trackDbData(trackType, trackName, trackUrl, childArr, fileData, function(err, trackData) {
                                if (err) {
                                    console.log(err);
                                }
                                console.log(trackData);
                            })
                        };
                    })
                })
            })
        }
    });
});


function findInDb(collectionName, queryParam, callback) {
    console.log()
    MongoClient.connect('mongodb://localhost:27017/devops_new', function(err, db) {
        if (err) {
            console.log('Unable to connect mongoDB client:Error:', err);
        } else {
            console.log('Connection established to', "mongodb://localhost:27017/devops_new");
            collection = db.collection(collectionName);
            collection.find(queryParam).toArray(function(err, result) {
                callback(err, result);
                db.close();
            });
        }
    });
}


function updateInDb(collectionName, queryParam, data, callback) {
    MongoClient.connect('mongodb://localhost:27017/devops_new', function(err, db) {
        if (err) {
            console.log('Unable to connect mongoDB client:Error:', err);
        } else {
            console.log('Update data in db', 'Connection established to', "mongodb://localhost:27017/devops_new");
            collection = db.collection(collectionName);
            collection.update(queryParam, data, function(err, result) {
                callback(err, result);
                db.close();
            });
        }
    });
}

function orgDBdata(fileData, callback) {
    console.log("START::find orgData in mongoDB");
    findInDb('d4dmastersnew', {
        id: '1',
        orgname: fileData.orgname
    }, function(err, orgData) {
        if (err) {
            callback(err, null);
            return;
        }
        console.log("END::find orgData in mongoDB");
        callback(null, orgData[0]);
        return;
    });
}

function projDbData(orgData, fileData, callback) {
    console.log("START::find projData in mongoDB");
    findInDb('d4dmastersnew', {
        id: '4',
        projectname: fileData.project,
        productgroupname: fileData.productgroupname,
        orgname: orgData.orgname
    }, function(err, projData) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, projData[0]);
        return;

    });
}

function teamDbData(orgData, projData, teamName, fileData, callback) {
    console.log("START::find team in mongoDB");
    findInDb('d4dmastersnew', {
        id: '21',
        teamname: teamName,
        projectname: projData.projectname,
        orgname: orgData.orgname,
    }, function(err, teamData) {
        if (err) {
            callback(err, null);
            return;
        }
        if (teamData.length == 0) {
            insertTeamSeedData(orgData, projData, teamName, fileData, function(err, insertedEntry) {
                if (err) {
                    callback(err, null);
                    console.log("Print Error Here::", err);
                    return;
                }
                callback(null, insertedEntry);
                return;

            })
        } else {
            callback(null, teamData[0]);
            return;
        }
    });
}

function insertTeamSeedData(orgData, projData, teamName, fileData, callback) {
    console.log("START::insertTeamSeedData");
    var r = request.post(fileData.catalystURL + "d4dMasters/savemasterjsonrownew/21/null/" + fileData.orgname, function(err, httpResponse, body) {
        if (err) {
            console.log("END::insertTeamSeedData");
            callback(err, null);
            return console.error('upload failed:', err);
        }
        console.log("END::insertTeamSeedData");
        teamDbData(orgData, projData, teamName, fileData, function(err, teamData) {
            if (err) {
                console.log("Error in retrieving team data from MongoDb::", err);
            }
            callback(null, teamData);
        })
    });
    var form = r.form();
    form.append('teamname', teamName);
    form.append('description', teamName);
    form.append('orgname', fileData.orgname);
    form.append('orgname_rowid', orgData.rowid);
    form.append('projectname', projData.projectname);
    form.append('projectname_rowid', projData.rowid);
    form.append('loginname', '');
}


function userDbData(orgData, userName, teamData, userRoleData, fileData, callback) {
    console.log("START::find userData in mongoDB");
    findInDb('d4dmastersnew', {
        id: '7',
        loginname: userName,
        teamname: teamData.teamname
    }, function(err, userData) {
        if (err) {
            callback(err, null);
            return;
        }
        if (userData.length == 0) {
            insertUserSeedData(orgData, userName, teamData, userRoleData, fileData, function(err, insertedEntry) {
                if (err) {
                    callback(err, null);
                    console.log("Print Error Here::", err);
                    return;
                }
                callback(null, insertedEntry);
                return;

            })
        } else {
            callback(null, userData[0]);
            return;
        }
    });
}

function insertUserSeedData(orgData, userName, teamData, userRoleData, fileData, callback) {
    console.log("START::insertUserSeedData");
    var r = request.post(fileData.catalystURL + "d4dMasters/savemasterjsonrownew/7/null/" + fileData.orgname, function(err, httpResponse, body) {
        if (err) {
            console.log("END::insertUserSeedData");
            callback(err, null);
            return console.error('upload failed:', err);
        }
        console.log("END::insertUserSeedData");
        userDbData(orgData, userName, teamData, userRoleData, fileData, function(err, userData) {
            if (err) {
                console.log("Error in retrieving user data from MongoDb::", err);
            }
            callback(null, userData);
        })
    });
    var form = r.form();
    form.append('loginname', userName);
    form.append('email', 'user@gmail.com');
    form.append('password', 'pass@123');
    form.append('cnfPassword', 'pass@123');
    form.append('orgname', orgData.orgname);
    form.append('orgname_rowid', orgData.rowid);
    form.append('userrolename', userRoleData.userrolename);
    form.append('userrolename_rowid', userRoleData.rowid);
    form.append('teamname', teamData.teamname);
    form.append('teamname_rowid', teamData.rowid);
}

function userroleDbData(callback) {
    console.log("START::find userData in mongoDB");
    findInDb('d4dmastersnew', {
        id: '6'
    }, function(err, userroleData) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, userroleData);
        return;
    });
}

function tempTypeDbData(callback) {
    console.log("START::find userData in mongoDB");
    findInDb('d4dmastersnew', {
        id: '16'
    }, function(err, temptypeData) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, temptypeData);
        return;
    });
}

function insertTemplateSeedData(orgData, chefData, tempName, tempType, cookbookIcon, cookbook, tempfiles, tempfilesPath, cookbookImagepath, fileData, callback) {
    console.log("START :: insertTemplateSeedData ");
    if (tempType === "SoftwareStack") {

        var url = fileData.catalystURL + "d4dMasters/savemasterjsonrownew/17/templatesicon/" + orgData.orgname;

    } else if (tempType === "CloudFormation") {

        var url = fileData.catalystURL + "d4dMasters/savemasterjsonrownew/17/templatesicon,template/" + orgData.orgname;

    } else {

        var url = fileData.catalystURL + "d4dMasters/savemasterjsonrownew/17/templatesicon,template/" + orgData.orgname;

    }
    var r = request.post(url, function(err, httpResponse, body) {
        if (err) {
            console.log("END :: insertTemplateSeedData");
            callback(err, null);
            return console.log('upload failed:', err);
        }
        console.log("END :: insertTemplateSeedData");
        tempDbData(orgData, chefData, tempName, tempType, cookbookIcon, cookbook, tempfiles, tempfilesPath, cookbookImagepath, fileData, function(err, tempData) {
            if (err) {
                console.log("Error in retrieving template data from mongoDb::", err);
            }
            callback(null, tempData);
        })
    });
    var form = r.form();
    if (tempType === "SoftwareStack") {
        console.log(cookbookImagepath + '/' + cookbookIcon, cookbookIcon);
        form.append('templatename', tempName);
        form.append('templatetypename', tempType);
        form.append('orgname_rowid', orgData.rowid);
        form.append('templatescookbooks', cookbook);
        form.append('orgname', orgData.orgname);
        form.append('templatesicon_filename', cookbookIcon);
        form.append('templatesicon', fs.createReadStream(cookbookImagepath + '/' + cookbookIcon), {
            filename: cookbookIcon
        });
    } else if (tempType === "CloudFormation") {
        form.append('templatename', tempName);
        form.append('templatetypename', tempType);
        form.append('orgname_rowid', orgData.rowid);
        form.append('templatescookbooks', cookbook);
        form.append('orgname', orgData.orgname);
        form.append('template_filename', tempfiles);
        form.append('template', fs.createReadStream(tempfilesPath + '/' + tempfiles), {
            filename: tempfiles
        });
        form.append('templatesicon_filename', cookbookIcon);
        form.append('templatesicon', fs.createReadStream(cookbookImagepath + '/' + cookbookIcon), {
            filename: cookbookIcon
        });
    } else {
        form.append('templatename', tempName);
        form.append('templatetypename', tempType);
        form.append('orgname_rowid', orgData.rowid);
        form.append('templatescookbooks', cookbook);
        form.append('orgname', orgData.orgname);
        form.append('template_filename', tempfiles);
        form.append('template', fs.createReadStream(tempfilesPath + '/' + tempfiles), {
            filename: tempfiles
        });
        form.append('templatesicon_filename', cookbookIcon);
        form.append('templatesicon', fs.createReadStream(cookbookImagepath + '/' + cookbookIcon), {
            filename: cookbookIcon
        });
    }
}


function tempDbData(orgData, chefData, tempName, tempType, cookbookIcon, cookbook, tempfiles, tempfilesPath, cookbookImagepath, fileData, callback) {
    console.log("START:: find tempDbData in mongoDb");
    findInDb('d4dmastersnew', {
            id: "17",
            templatename: tempName,
            orgname: orgData.orgname,
            templatetypename: tempType
        },
        function(err, tempData) {
            if (err) {
                console.log("Error :: tempDbData", err);
                callback(err, null);
                return;
            }
            if (tempData.length == 0) {
                insertTemplateSeedData(orgData, chefData, tempName, tempType, cookbookIcon, cookbook, tempfiles, tempfilesPath, cookbookImagepath, fileData, function(err, insertedEntry) {
                    if (err) {
                        callback(err, null);
                        console.log("Print Error Here::", err);
                        return;
                    }
                    callback(null, insertedEntry);
                })
            } else {
                callback(null, tempData[0]);
                return;
            }
        });
}

function chefDbData(orgData, fileData, callback) {
    console.log("START::find chefData in mongoDB");
    findInDb('d4dmastersnew', {
        id: '10',
        configname: fileData.chefDetail.configname
    }, function(err, chefData) {
        if (err) {
            callback(err, null);
            return;
        }
        if (chefData.length == 0) {
            insertChefSeedData(orgData, fileData, function(err, insertedEntry) {
                if (err) {
                    console.log("Error in insertChefSeedData:", err);
                    callback(err, null);
                    return;
                }
                callback(null, insertedEntry);
            })
        } else {
            console.log("END::find chefData in mongoDB");
            callback(null, chefData[0]);
            return;
        }
    });
}

function insertChefSeedData(orgData, fileData, callback) {
    console.log("START::insertChefServerSeedData");
    console.log();
    var r = request.post(fileData.catalystURL + "d4dMasters/savemasterjsonrownew/10/userpemfile,kniferbfile,validatorpemfile/" + fileData.orgname, function(err, httpResponse, body) {
        if (err) {
            console.log("END::insertChefServerSeedData");
            callback(err, null);
            return console.error('upload failed:', err);
        }
        console.log("END::insertChefServerSeedData");
        chefDbData(orgData, fileData, function(err, chefData) {
            if (err) {
                console.log("Error in retrieving chef data from MongoDb::", err);
            }
            callback(null, chefData);
        })
    });
    var form = r.form();
    console.log()
    form.append('configname', fileData.chefDetail.configname);
    form.append('loginname', fileData.chefDetail.chefserverloginname);
    form.append('url', fileData.chefDetail.chefServerURL);
    form.append('orgname', orgData.orgname);
    form.append('orgname_rowid', orgData.rowid);
    form.append('folderpath', fileData.cheffolderpath);
    form.append('kniferbfile_filename', fileData.chefDetail.kniferbfile);
    form.append('userpemfile_filename', fileData.chefDetail.userpemfile);
    form.append('validatorpemfile_filename', fileData.chefDetail.validatorpemfile);
    form.append('kniferbfile', fs.createReadStream(fileData.chefrepoPath + '/' + fileData.chefDetail.kniferbfile), {
        filename: fileData.chefDetail.kniferbfile
    });
    form.append('userpemfile', fs.createReadStream(fileData.chefrepoPath + '/' + fileData.chefDetail.userpemfile), {
        filename: fileData.chefDetail.userpemfile
    });
    form.append('validatorpemfile', fs.createReadStream(fileData.chefrepoPath + '/' + fileData.chefDetail.validatorpemfile), {
        filename: fileData.chefDetail.validatorpemfile
    });
}

function insertEnvironmentseedData(orgData, projData, chefData, envName, fileData, callback) {
    console.log("START::insertEnvironmentseedData");
    var newURL = fileData.catalystURL + "d4dMasters/savemasterjsonrownew/3/null/" + fileData.orgname;
    var reqBody = {
        environmentname: envName,
        configname_rowid: chefData.rowid,
        configname: chefData.configname,
        projectname: projData.projectname,
        projectname_rowid: projData.rowid,
        puppetservername: "",
        orgname_rowid: orgData.rowid,
        orgname: orgData.orgname
    };
    request({
        url: newURL,
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        json: reqBody
    }, function(error, response, body) {
        if (error) {
            callback(error, null);
            console.log("END::insertEnvironmentsSeedData");
            console.log("Error:", error);
        } else {
            console.log("END::insertEnvironmentsSeedData");
            console.log(response.statusCode, body);
            envDbData(orgData, projData, chefData, envName, fileData, function(err, envData) {
                if (err) {
                    console.log("Error in retrieving env data from MongoDb::", err);
                }
                callback(null, envData);
            })
        }

    });
}

function envDbData(orgData, projData, chefData, envName, fileData, callback) {
    console.log("START::find envData in mongoDB");
    findInDb('d4dmastersnew', {
        id: "3",
        environmentname: {
            $in: [envName]
        },
        orgname: fileData.orgname
    }, function(err, envData) {
        if (err) {
            callback(err, null);
            return;
        }
        if (envData.length == 0) {
            insertEnvironmentseedData(orgData, projData, chefData, envName, fileData, function(err, insertedEntry) {
                if (err) {
                    callback(err, null);
                    return;
                }
                callback(null, insertedEntry);
            })
        } else {
            console.log("END::find envData in mongoDB");
            callback(null, envData[0]);
            return;
        }
    });
}


function createChefEnv(envName, chefData, callback) {
    console.log("START::insertEnvironmentseedData");
    var newURL = fileData.catalystURL + "chef/environments/create/" + chefData.rowid;
    var reqBody = {
        envName: envName,
    };
    request({
        url: newURL,
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        json: reqBody
    }, function(error, response, body) {
        if (error) {
            callback(error, null);
            console.log("END::insertEnvironmentsSeedData");
            console.log("Error:", error);
        } else {
            console.log("END::insertEnvironmentsSeedData");
            console.log(response.statusCode, body);
            callback(null, body);
        }

    });
}

function trackDbData(trackType, trackName, trackUrl, childArr, fileData, callback) {
    findInDb('tracks', {
        type: trackType,
        itemUrls: {
            $elemMatch: {
                name: trackName
            }
        }
    }, function(err, trackData) {
        if (err) {
            callback(err, null);
            return;
        }
        console.log(trackData);
        if (trackData.length === 0) {
            trackInsertData(trackType, trackName, trackUrl, childArr, fileData, function(err, insertedEntry) {
                if (err) {
                    callback(err, null);
                    return;
                }
                callback(null, insertedEntry);
            })
        } else {
            callback(null, trackData);
            return;
        }
    })
}

function trackInsertData(trackType, trackName, trackUrl, childArr, fileData, callback) {
    var newURL = "http://localhost:3001/track";
    //console.log(trackType,trackName,trackUrl,childArr);
    var trackData = {
        itemUrls: [{
            name: trackName,
            url: trackUrl,
            description: trackName,
            childItem: childArr
        }],
        type: trackType
    }
    var reqBody = {};
    reqBody.trackData = trackData;
    request({
        url: newURL, //URL to hit
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        json: reqBody
    }, function(error, response, body) {
        if (error) {
            console.log("Error body:", response);
            callback(err, null);
            return;
        }
        trackDbData(trackType, trackName, trackUrl, childArr, fileData, function(err, trackData) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, trackData);
        });
    });
}