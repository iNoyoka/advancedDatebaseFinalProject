var express = require('express');
var router = express.Router();

//================================================
// Temporary Variable

var neo4j = require('neo4j-driver');
const driver = new neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "as123512"));
var tx = driver.session();
var session = tx.beginTransaction();

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
/*
forumList.push({id:1,studentid:"alpha",courseid:"1",content:"ADB is trash",viewable:true});
forumList.push({id:2,studentid:"beta",courseid:"1",content:"ADB is good",viewable:true});
forumList.push({id:3,studentid:"gamma",courseid:"1",content:"ADB is... uh, hard to say",viewable:true});
forumList.push({id:4,studentid:"theta",courseid:"1",content:"ADB is .. hmm well, you know",viewable:true});
*/


//================================================

//================================================
// USER ACCOUNT
//================================================
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/logout',function(req,res,next){
  req.session.destroy();
  res.redirect('/');
});

// NOT
router.post('/loginCheck',function(req,res,next){
  var id = req.body.id;
  var pwd = req.body.pwd;
	con.query("SELECT * FROM `studentList` WHERE `studentid`='"+id+"' AND `studentpwd`='"+pwd+"'",function(err,result){
		if(err) console.log(err);
		else{
			if(result.lenth==0) res.send("Error Occur.");
			else{
				req.session.name = id;
				res.send("Account Exist.");
			}
		}
	});
});

// NOT
router.post('/registerCheck',function(req,res,next){
  var id = req.body.id;
  var pwd = req.body.pwd;
	con.query("SELECT * FROM `studentList` WHERE `studentid`='"+id+"'",function(err,result){
		if(err) console.log(err);
		else{
			console.log(result.length);
			if(result.lenth==0){
				req.session.name = id;
				con.query("INSERT INTO `studentList` (`studentid`, `studentpwd`) VALUES ('"+id+"', '"+pwd+"')",function(err,result){
					if(err) console.log(err);
				});
				res.send("Success.");
			}
			else{
				res.send("Account Exist.");
			}
		}
	});
});

//================================================
// HOME
//================================================
// DONE
router.get('/home', function(req, res, next) {
  res.render('home',{name: req.session.name});
});

// DONE
router.get('/home/personalPage',function(req,res,next){
  res.render('personalPage',{name: req.session.name});
  
});

// ALMOST DONE
router.post('/home/searchCourses',function(req,res,next){
  var keywords = req.body.keywords;
  var showlist = [];
	//FIND KEYWORDS IN DB
	session
		.run("match (c:Course) match (c)-->(p:Provider) match (a:Author)-->(c) match (t:Topic) where t.Topic=~ '(?i).*"+keywords+".*' return distinct c.idx AS `courseid`, c.Title AS `coursename`, a.author AS `professor`, p.Provider AS `school` ORDER BY toInteger(c.idx) ASC")
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
		})
		.catch(error => {
			console.log(error);
		})
});

// ALMOST DONE
router.post('/home/listPersonalCourse',function(req,res,next){
	var courselist = [];
	var idlist = [];
	var sql = "SELECT * FROM `studentCourse` WHERE `studentid`='"+req.session.name+"'";
	con.query(sql,function(err,result){
		if(err){
			console.log('error occur in "listPersonalCourse"');
		}else{
			for(i in result){
				var obj = {
					courseid: result[i].studentcourse_name,
					coursename: "test",
					professor: "test",
					state: result[i].studentcourse_bool
				}
				courselist.push(obj);
				idlist.push("'"+obj.courseid+"'");
			}
			session
				.run("match (c:Course) match (a:Author)-->(c) where c.idx in ["+idlist+"] return distinct c.idx AS `id`, c.Title AS `coursename`, a.author AS `professor`")
				.then(result2 => {
					var anoidlist = [];
					var temp_i = 0;
					result2.records.forEach(function (record) {
						console.log(record.get('coursename')+" - "+record.get('professor'));
						if(anoidlist.includes(record.get('id'))){
						}
						else{
							anoidlist.push(record.get('id'));
							courselist[temp_i].coursename = record.get('coursename');
							courselist[temp_i].professor = record.get('professor');
							temp_i++;
						}
					});
					var LIST = JSON.stringify(courselist);
					res.send(LIST);
				})
				.catch(error => {
					console.log(error);
				})
		}
	});
});

//================================================
// COURSE
//================================================
// NOT
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

// NOT
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
