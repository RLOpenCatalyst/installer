  var fs = require('fs');
  var mongodb = require('mongodb');
  var exit = require('exit');
  var request = require('request'),
    url = require('url');
  var request = require('request');
  var MongoClient = mongodb.MongoClient;
  var userDataArr = [];
  var trackArr = [];
  var role = [];
  var request = request.defaults({
    jar: true
  });


  fs.readFile("EvalSetup.json", 'utf8', function(err, data) {
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
            console.log("Error : in orgDBdata", err);
          }
          chefDbData(orgData, fileData, function(err, chefData) {
            if (err) {
              console.log("Error : in chefDbData", err);
            }
            projDbData(orgData, fileData, function(err, projData) {
              if (err) {
                console.log("Error : in projDbData", err);
              }
              for (var i = 0; i < fileData.envNames.length; i++) {
                var envName = fileData.envNames[i];
                envDbData(orgData, projData, chefData, envName, fileData, function(err, envData) {
                  if (err) {
                    console.log("Error : in envDbData", err);
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
                        console.log("Error : in findInDb", err);
                        callback(err, null);
                        return;
                      }
                      var envNameArr = '';
                      var envIdArr = '';
                      for (var l = 0; l < envData.length; l++) {
                        envNameArr = envNameArr + envData[l].environmentname + ',';
                        envIdArr = envIdArr + envData[l].rowid + ',';
                      }
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
                          console.log("Error : in updateInDb", err);
                          callback(err, null);
                          return;
                        }
                      })
                    });
                  })
                })
              };
              (function(chefData) {
                tempTypeDbData(function(err, tempTypedata) {
                  if (err) {
                    console.log(err);
                  }
                  for (var i = 0; i < tempTypedata.length; i++) {
                    for (var k = 0; k < fileData.tempJson.length; k++) {
                      if (tempTypedata[i].templatetypename === fileData.tempJson[k].tempType) {
                        var tempType = fileData.tempJson[k].tempType;
                        for (var j = 0; j < fileData.tempJson[k].name.length; j++) {
                          var cookbookIcon = fileData.tempJson[k].cookbookicon[j];
                          var cookbookImagepath = fileData.tempJson[k].cookbookImagepath;
                          var tempName = fileData.tempJson[k].name[j];
                          if (fileData.tempJson[k].cookbooks[j] !== undefined) {
                            var cookbook = fileData.tempJson[k].cookbooks[j]
                          } else {
                            var cookbook = "";
                          }

                          if (fileData.tempJson[k].tempfiles[j] !== undefined) {
                            var tempfiles = fileData.tempJson[k].tempfiles[j];
                          } else {
                            var tempfiles = "";
                          }


                          if (fileData.tempJson[k].tempFilespath !== undefined) {
                            var tempfilesPath = fileData.tempJson[k].tempFilespath;
                          } else {
                            var tempfilesPath = "";
                          }

                          if (fileData.tempJson[k].dockercontainerpaths[j] !== undefined) {
                            var dockerrepoPath = fileData.tempJson[k].dockercontainerpaths[j];      
                          } else {
                            var dockerrepoPath = "";
                          }
                          tempDbData(orgData, chefData, tempName, tempType, cookbookIcon, cookbook, tempfiles, tempfilesPath, cookbookImagepath, dockerrepoPath, fileData, function(err, tempData) {
                            if (err) {
                              console.log("Error : in tempDbData", err);
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
                      console.log("Error : in teamDbData", err);
                    };
                    userroleDbData(function(err, roleData) {
                      if (err) {
                        console.log("Error : in userroleDbData", err);
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
                                userDataArr.push(userData);
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
                      console.log("Error : in findInDb");
                      callback(err, null);
                      return;
                    }
                    var usernameArr = '';
                    var userIdArr = '';
                    for (var j = 0; j < userData.length; j++) {
                      usernameArr = usernameArr + userData[j].loginname + ',';
                      userIdArr = userIdArr + userData[j].rowid + ',';
                    };
                    if (usernameArr.length === 2) {
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
                          callback(err, null);
                          console.log("Error : in updateInDb", err);
                          return;
                        }
                      })
                    };
                  })
                })(teamName);
              };
              var tempCount = 0;
              for (var i = 0; i < fileData.trackDetail.length; i++) {
                var trackType = fileData.trackDetail[i].type;
                var trackJson = fileData.trackDetail[i].itemUrls;
                for (var j = 0; j < fileData.trackDetail[i].itemUrls.length; j++) {
                  var trackName = fileData.trackDetail[i].itemUrls[j].name;
                  (
                    function(j, trackType, trackJson, trackName, i) {
                    trackDbData(trackType, trackName, trackJson, fileData, function(err, trackData) {
                      tempCount++;
                      if (err) {
                        console.log("Error : in trackDbData", err);
                      }
                      if (trackData === undefined || trackData === null) {
                        trackArr = [];
                      }else{
                        trackArr.push(trackData);
                      }
                      if (i === fileData.trackDetail.length - 1 && j === fileData.trackDetail[i].itemUrls.length - 1) {
                       //if(tempCount === i*ln) {
                        //{"type":"Provider"},{$pull:{itemUrls:{"name":"test"}}
                        if (trackArr.length !== 0) {
                          for (var k = 0; k < trackArr.length; k++) {
                            var nameValue =  trackArr[k].itemUrls[k].name
                            removeInDb("tracks",{
                              type: trackType,
                            },{
                              $pull: {
                                itemUrls: {
                                  name: nameValue
                                }
                              }
                            },function(err, removedData){
                              if (err) {
                                console.log(err);
                              }
                              if (k === trackArr.length) {
                                trackInsertData(trackType, trackJson, fileData, function(err, data) {
                                  if (err) {
                                    console.log(err);
                                  }
                                  console.log("Inserted track Data", JSON.stringify(data));
                                })
                              }
                            })
                          }
                      } else {
                          trackInsertData(trackType, trackJson, fileData, function(err, data) {
                            if (err) {
                              console.log(err);
                            }
                            console.log("Inserted track Data", JSON.stringify(data));
                          })
                        }
                      }
                    })
                  })(j, trackType, trackJson, trackName, i);
                }
              };
              for (var i = 0; i < fileData.servicesdetail.length; i++) {
                for (var j = 0; j < fileData.servicesdetail[i].servicename.length; j++) {
                  var serviceName = fileData.servicesdetail[i].servicename[j];
                  var commandName = fileData.servicesdetail[i].commandname[j];
                  var commandType = fileData.servicesdetail[i].commandtype;
                  var serviceCookbook = fileData.servicesdetail[i].servicecookbook[j];
                  var Os = fileData.servicesdetail[i].operatingsystem;
                  var command = fileData.servicesdetail[i].command[j];
                  servicesDbData(orgData, serviceName, commandName, commandType, chefData, serviceCookbook, Os, command, fileData, function(err, serviceData) {
                    if (err) {
                      console.log("Error : in servicesDbData", err);
                    };
                    console.log("serviceData::::", JSON.stringify(serviceData));
                  });
                };
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
        console.log('Update data in db,Connection established to,mongodb://localhost:27017/devops_new');
        collection = db.collection(collectionName);
        collection.update(queryParam, data, function(err, result) {
          callback(err, result);
          db.close();
        });
      }
    });
  }

  function removeInDb(collectionName, queryParam, data, callback) {
    MongoClient.connect('mongodb://localhost:27017/devops_new', function(err, db) {
      if (err) {
        console.log('Unable to connect mongoDB client:Error:', err);
      } else {
        console.log('Connection established to mongodb://localhost:27017/devops_new now Remove ' + collectionName + ' data in db');
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
        console.log("END::find orgData in mongoDB");
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
        console.log("END::find projData in mongoDB");
        callback(err, null);
        return;
      }
      console.log("END::find projData in mongoDB");
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
        console.log("Error : in findInDb")
        return;
      }
      if (teamData.length == 0) {
        insertTeamSeedData(orgData, projData, teamName, fileData, function(err, insertedEntry) {
          if (err) {
            callback(err, null);
            console.log("Error : in insertTeamSeedData", err);
            return;
          }
          console.log("END : insertTeamSeedData", JSON.stringify(insertedEntry));
          callback(null, insertedEntry);
          return;

        })
      } else {
        console.log("END : insertTeamSeedData", JSON.stringify(teamData[0]));
        callback(null, teamData[0]);
        return;
      }
    });
  }

  function insertTeamSeedData(orgData, projData, teamName, fileData, callback) {
    console.log("START::insertTeamSeedData");
    var r = request.post(fileData.catalystURL + "d4dMasters/savemasterjsonrownew/21/null/" + fileData.orgname, function(err, httpResponse, body) {
      if (err) {
        console.log("Error : in insertTeamSeedData", err);
        callback(err, null);
        return
      }
      teamDbData(orgData, projData, teamName, fileData, function(err, teamData) {
        if (err) {
          console.log("Error : in teamDbData", err);
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
        console.log("Error : in findInDb");
        callback(err, null);
        return;
      }
      if (userData.length == 0) {
        insertUserSeedData(orgData, userName, teamData, userRoleData, fileData, function(err, insertedEntry) {
          if (err) {
            callback(err, null);
            console.log("Error : in insertUserSeedData", err);
            return;
          }
          console.log("END : insertUserSeedData", JSON.stringify(insertedEntry));
          callback(null, insertedEntry);
          return;

        })
      } else {
        console.log("END : insertUserSeedData", JSON.stringify(userData[0]));
        callback(null, userData[0]);
        return;
      }
    });
  }

  function insertUserSeedData(orgData, userName, teamData, userRoleData, fileData, callback) {
    console.log("START::insertUserSeedData");
    var r = request.post(fileData.catalystURL + "d4dMasters/savemasterjsonrownew/7/null/" + fileData.orgname, function(err, httpResponse, body) {
      if (err) {
        console.log("END::insertUserSeedData", err);
        callback(err, null);
        return
      }
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
    console.log("START::find userRoleData in mongoDB");
    findInDb('d4dmastersnew', {
      id: '6'
    }, function(err, userroleData) {
      if (err) {
        console.log("Error : in userroleDbData")
        callback(err, null);
        return;
      }
      console.log("END::find userRoleData in mongoDB");
      callback(null, userroleData);
      return;
    });
  }

  function tempTypeDbData(callback) {
    console.log("START::find tempTypeData in mongoDB");
    findInDb('d4dmastersnew', {
      id: '16'
    }, function(err, temptypeData) {
      if (err) {
        console.log("Error : in tempTypeDbData")
        callback(err, null);
        return;
      }
      console.log("END::find tempTypeData in mongoDB");
      callback(null, temptypeData);
      return;
    });
  }

  function insertTemplateSeedData(orgData, chefData, tempName, tempType, cookbookIcon, cookbook, tempfiles, tempfilesPath, cookbookImagepath, dockerrepoPath, fileData, callback) {
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
      tempDbData(orgData, chefData, tempName, tempType, cookbookIcon, cookbook, tempfiles, tempfilesPath, cookbookImagepath, dockerrepoPath, fileData, function(err, tempData) {
        if (err) {
          console.log("Error : in tempDbData", err);
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
    } else if (tempType === "ARMTemplate") {
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
      form.append('dockercontainerpaths', dockerrepoPath);
      form.append('templatesicon_filename', cookbookIcon);
      form.append('templatesicon', fs.createReadStream(cookbookImagepath + '/' + cookbookIcon), {
        filename: cookbookIcon
      });
    }
  }

  function tempDbData(orgData, chefData, tempName, tempType, cookbookIcon, cookbook, tempfiles, tempfilesPath, cookbookImagepath, dockerrepoPath, fileData, callback) {
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
          insertTemplateSeedData(orgData, chefData, tempName, tempType, cookbookIcon, cookbook, tempfiles, tempfilesPath, cookbookImagepath, dockerrepoPath, fileData, function(err, insertedEntry) {
            if (err) {
              callback(err, null);
              console.log("Print Error Here::", err);
              return;
            }
            console.log("END:: find tempDbData in mongoDb");
            callback(null, insertedEntry);
          })
        } else {
          console.log("END:: find tempDbData in mongoDb");
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
          console.log("END::find chefData in mongoDB");
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
          console.log("END::find envData in mongoDB");
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
        callback(null, body);
      }

    });
  }

  function trackDbData(trackType, trackName, trackJson, fileData, callback) {
    console.log("START::find trackDbData in mongoDB");
    findInDb('tracks', {
      type: trackType,
      itemUrls: {
        $elemMatch: {
          name: trackName
        }
      }
    }, function(err, trackData) {
      if (err) {
        console.log("END::find envData in mongoDB");
        callback(err, null);
        return;
      }
      console.log("END::find envData in mongoDB");
      callback(null, trackData[0]);
      return;
    })
  }

  function trackInsertData(trackType, trackJson, fileData, callback) {
    console.log("START::insertTrackseedData");
    var newURL = "http://localhost:3001/track";
    var trackData = {
      type: trackType,
      itemUrls: trackJson
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
        console.log("END::insertTrackseedData");
        callback(err, null);
        return;
      }
      callback(null, reqBody);
      return;
    });
  }

  function servicesDbData(orgData, serviceName, commandName, commandType, chefData, serviceCookbook, Os, command, fileData, callback) {
    console.log("START ::: servicesDbData");
    findInDb('d4dmastersnew', {
      id: "19",
      servicename: serviceName,
      commandtype: commandType,
      orgname: orgData.orgname
    }, function(err, serviceData) {
      if (err) {
        console.log("END ::: servicesDbData", err);
        callback(err, null);
        return;
      }
      if (serviceData.length === 0) {
        insertServicesSeedData(orgData, serviceName, commandName, commandType, chefData, serviceCookbook, Os, command, fileData, function(err, insertedEntry) {
          if (err) {
            callback(err, null);
            return;
          }
          callback(null, insertedEntry);
        })
      } else {
        console.log("END : insertServicesSeedData");
        callback(null, serviceData);
        return;
      }
    })
  }

  function insertServicesSeedData(orgData, serviceName, commandName, commandType, chefData, serviceCookbook, Os, command, fileData, callback) {
    console.log("START :: insertServicesSeedData");
    var newURL = fileData.catalystURL + "d4dMasters/savemasterjsonrownew/19/null/" + fileData.orgname;
    if (commandType === "Chef Cookbook/Recipe") {
      var reqBody = {
        orgname: orgData.orgname,
        orgname_rowid: orgData.rowid,
        servicename: serviceName,
        commandname: commandName,
        commandtype: commandType,
        configname: chefData.configname,
        configname_rowid: chefData.rowid,
        chefserverid: chefData.rowid,
        servicecookbook: serviceCookbook,
        operatingsystem: Os,
        command: "",
        servicestart: "start",
        servicestop: "stop",
        servicekill: "none",
        servicestatus: "none"
      }
    } else {
      var reqBody = {
        orgname: orgData.orgname,
        orgname_rowid: orgData.rowid,
        servicename: serviceName,
        commandname: commandName,
        commandtype: commandType,
        configname: chefData.configname,
        configname_rowid: chefData.rowid,
        chefserverid: chefData.rowid,
        operatingsystem: Os,
        command: command,
        commandaction: "start,stop,restart",
        servicestart: "none",
        servicestop: "none",
        servicekill: "none",
        servicestatus: "none"
      }
    }

    request({
      url: newURL, //URL to hit
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      json: reqBody
    }, function(error, response, body) {
      if (error) {
        console.log("Error :: in insertServicesSeedData", err);
        callback(err, null);
        return;
      }
      servicesDbData(orgData, serviceName, commandName, commandType, chefData, serviceCookbook, Os, command, fileData, function(err, serviceData) {
        if (err) {
          console.log("Error : in servicesDbData", err);
          callback(err);
          return;
        }
        console.log("END :: insertServicesSeedData", serviceData);
        callback(null, serviceData);
      });
    });
  }
