var express = require('express');
var router = express.Router();

//================================================
// Temporary Variable

var neo4j = require('neo4j-driver');
const driver = new neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "as123512"));
var session = driver.session();

var mysql      = require('mysql');
var con = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'as123512',
  database : 'project'
});
 
con.connect();

/*
session
	.run('match (a:Author) --> (c:Course) match (c) --> (p:Provider)where c.Title=~ "(?i).*machine learning.*" return c.Title AS title, a.Name AS name, p.School AS school')
	.then(result => {
		result.records.forEach(function (record) {
      console.log(record.get('title'));
    });
    session.close();
	})
	.catch(error => {
		console.log(error);
	})
*/

var studentList = [];
var objSuper = {
  studentid: "superaccount",
  studentpwd: "superaccount",
  studentcourse: "#"
};
studentList.push(objSuper);

var forumList = [];
forumList.push({id:1,studentid:"alpha",courseid:"1",content:"ADB is trash",viewable:true});
forumList.push({id:2,studentid:"beta",courseid:"1",content:"ADB is good",viewable:true});
forumList.push({id:3,studentid:"gamma",courseid:"1",content:"ADB is... uh, hard to say",viewable:true});
forumList.push({id:4,studentid:"theta",courseid:"1",content:"ADB is .. hmm well, you know",viewable:true});


//================================================

//================================================
// USER ACCOUNT
//================================================
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/logout',function(req,res,next){
  req.session.destroy();
  res.render('index');
});

router.post('/loginCheck',function(req,res,next){
  var id = req.body.id;
  var pwd = req.body.pwd;
  var err = 0;
  for(i in studentList){
    if(studentList[i].studentid==id && studentList[i].studentpwd==pwd){
      err = 1;
      req.session.name = studentList[i].studentid;
      res.send("Account Exist.");
      break;
    }
  }
  if(err==0) res.send("Error Occur.");
});

router.post('/registerCheck',function(req,res,next){
  var id = req.body.id;
  var pwd = req.body.pwd;
  var err = 0;
  for(i in studentList){
    if(studentList[i].studentid==id){
      err = 1;
      res.send("Account Exist.");
      break;
    }
  }
  if(err==0){
    var obj = {
      studentid: id,
      studentpwd: pwd,
      studentcourse: "#"
    }
    studentList.push(obj);
    // login
    req.session.name = id;
    res.send("Success.");
  }
});

//================================================
// HOME
//================================================
router.get('/home', function(req, res, next) {
  res.render('home',{name: req.session.name});
});

router.get('/home/personalPage',function(req,res,next){
  res.render('personalPage',{name: req.session.name});
  
});

router.post('/home/searchCourses',function(req,res,next){
  var keywords = req.body.keywords;
  var showlist = [];
	//FIND KEYWORDS IN DB
	/* NEW VERSION
	session
		.run()//find courseid coursename professor school
		.then(result => {
			result.records.forEach(function (record) {
				var obj = {
					courseid: record.get('courseid'),
					coursename: record.get('coursename'),
					professor: record.get('professor'),
					school: record.get('school')
				}
				showlist.push(obj);
			});
			var LIST = JSON.stringify(showlist);
			res.send(LIST);
			session.close();
		})
		.catch(error => {
			console.log(error);
		})
	*/
});

router.post('/home/listPersonalCourse',function(req,res,next){
  var showlist = [];
	var courselist = [];
  for(i in studentList){
    if(studentList[i].studentid==req.session.name){
			// use sql to fillout courselist (include courseid, state)
			// courselist.push(courseid: studentcourse_name,coursename: ,professor: ,state: studentcourse_bool)
			/* NEW VERSION
			var j = 0;
			session
				.run()//find courseid coursename professor
				.then(result => {
					result.records.forEach(function (record) {
						courselist[j].coursename = record.get('coursename');
						courselist[j].professor = record.get('professor');
						j++;
					});
					var LIST = JSON.stringify(courselist);
					res.send(LIST);
					session.close();
				})
				.catch(error => {
					console.log(error);
				})
			*/
    }
  }
});

//================================================
// COURSE
//================================================
router.get('/course/:courseid',function(req,res,next){
  var courseid = decodeURI(req.params.courseid);
	//
  for(i in courseList){
    if(courseList[i].courseid==courseid){
      for(j in studentList){
        if(studentList[j].studentid==req.session.name){
          if(studentList[j].studentcourse.includes(courseid)){
            res.render('course',{
              coursename: courseList[i].coursename,
              professor: courseList[i].professor,
              name: req.session.name,
              courseid: courseList[i].courseid,
              already: 1
            });
          }else{
            res.render('course',{
              coursename: courseList[i].coursename,
              professor: courseList[i].professor,
              name: req.session.name,
              courseid: courseList[i].courseid,
              already: 0
            });
          }
          break;
        }
      }
      break;
    }
  }
	//
});

router.post('/course/changePersonalCourse',function(req,res,next){
  var state = req.body.state;
  var courseid = req.body.courseid;
  var studentid = req.session.name;
  if(state=="take"){
    for(i in studentList){
      if(studentList[i].studentid==studentid){
        if(studentList[i].studentcourse=="#"){
          studentList[i].studentcourse += courseid + "#";
        }else{
          studentList[i].studentcourse += courseid + "#";
        }
      }
    }
  }else{
    for(i in studentList){
      if(studentList[i].studentid==studentid){
        console.log(studentList[i].studentcourse);
        var newlist = studentList[i].studentcourse.split("#");
        studentList[i].studentcourse = "#";
        for(j in newlist){
          if(newlist[j]!=courseid && newlist[j]!=""){
            studentList[i].studentcourse += newlist[j] + "#";
          }
        }
      }
    }
  }
  res.send("DONE");
});

//================================================
// FORUM
//================================================

router.post('/course/getForum',function(req,res,next){
  var courseid = req.body.courseid;
  var showlist = [];
  for(i in forumList){
    if(forumList[i].courseid==courseid && forumList[i].viewable){
      showlist.push(forumList[i]);
    }
  }
  var LIST = JSON.stringify(showlist);
  res.send(LIST);
});

router.post('/course/submitComment',function(req,res,next){
  var courseid = req.body.courseid;
  var studentid = req.body.studentid;
  var comment = req.body.comment;
  var obj = {
    id: forumList.length+1,
    studentid: studentid,
    courseid: courseid,
    content: comment,
    viewable: true
  }
  forumList.push(obj);
  res.send('DONE');
});

router.post('/course/deleteComment',function(req,res,next){
  var commentid = req.body.commentid;
  for(i in forumList){
    if(forumList[i].id==commentid){
      forumList[i].viewable = false;
      break;
    }
  }
  res.send('DONE');
});

module.exports = router;
