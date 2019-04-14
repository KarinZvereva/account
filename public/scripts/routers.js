const mysql  = require('mysql');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'accountisu'
  });

var str = "";
module.exports = function(app,passport){

        /*app.get('/logout', function(req, res){
                //req.logout();
                req.session.destroy(function (err) {
                    res.redirect('/login'); //Inside a callback… bulletproof!
                  });
        });*/

        //Authorization page
        function authentication() {
            return function (req, res, next) {
                if (req.isAuthenticated()) {
                    return next();
                }
                res.redirect('/login');
            }
        }

        app.get('/login',(req,res)=>{
            res.render('start_page',{name:req.flash('class'),error: req.flash('message')});   
        });


        app.post('/login',passport.authenticate('local', { successRedirect: '/profile',
                                                        failureRedirect: '/login',
                                                        failureFlash:true
        }));
        ///////////////////////////////////////////////////////////////////////////

        //Home page
        app.get('/profile',authentication(),(req,res)=>{
            connection.query("SELECT surname, name FROM users where username='"+req.user.username+"' AND password='"+req.user.password+"'",
            function(err, rows, fields) {
               if (rows && rows[0])
               str = rows[0].surname +" "+rows[0].name;
            });
            switch(req.user.role){
                case "admin": {
                    connection.query("SELECT * FROM groups order by year desc", function(err, rows, fields) {
                        var n;
                        var gr = rows;
                        connection.query("select t1.id, t2.surname, t2.name, t2.lastname, t1.text, t1.time  from notices as t1, users as t2 where t2.id=t1.user_id order by time desc", function(err, rows, fields) {
                            n = rows;
                            res.render('profile_admin', {groups: gr, not:n, user:str});
                        })

                    });
                    
                }
                break;
                case "teacher": {
                    connection.query("SELECT * FROM groups order by year desc", function(err, rows, fields) {
                        var n;
                        var gr = rows;
                        connection.query("SELECT id FROM users where username='"+req.user.username+"'", function(err, rows, fields) {
                            if (rows[0]) var id = rows[0].id;
                            connection.query("select t1.id, t2.surname, t2.name, t2.lastname, t1.text, t1.time  from notices as t1, users as t2 where t2.id=t1.user_id  and t1.user_id = "+id+" order by time desc", function(err, rows, fields) {
                            n = rows;
                            res.render('profile_teacher', {groups: gr, not:n, user:str});
                            })
                        });
                    });
                }
                break;
                case "student": {
                    var n;
                    connection.query("SELECT group_id FROM users where username='"+req.user.username+"'", function(err, rows, fields) {
                            if (rows[0]) var id = rows[0].group_id;
                            
                            connection.query("(select t2.surname, t2.name, t2.lastname, t1.text, t1.time  from notices as t1, users as t2 where t2.id=t1.user_id and t1.audit='all') UNION (SELECT t2.surname, t2.name, t2.lastname, t1.text, t1.time from notices as t1, users as t2, not_aud WHERE t2.id=t1.user_id and not_aud.group_id="+id+" and not_aud.not_id=t1.id) order by time desc", function(err, rows, fields) {
                            n = rows;

                            res.render('profile_student', {not:n, user:str});
                            })
                        });
                    }   
                break;
            }        
        })
        ////////////////////////////////////////////////////////

        //User page
        app.get('/users',(req,res)=>{
            connection.query("SELECT users.id,users.name,users.surname,users.lastname,DATE_FORMAT( `birthday` , '%d %M %Y' ) AS birthday,users.username,users.password,users.role,subquery1.name AS groupname,subquery1.direction,subquery1.year FROM users LEFT JOIN (SELECT groups.id,groups.year,groups.name,directions.direction FROM groups,directions WHERE groups.dir_id=directions.id) subquery1 ON users.group_id=subquery1.id",function(err, rows, fields) {
                if(err) throw err;
                res.render('users',{data:rows,user:str});
            });
        })
        ////////////////////////////////////////////////////////
        
        //Direction page
        app.get('/directions',(req,res)=>{
            connection.query("SELECT `id`,`code`,`direction` FROM `directions`",(err,rows,fields)=>{
                res.render('directions',{data:rows,user:str});
            });
        })
        app.post('/addDirection',(req,res)=>{   
            var code = req.body.code;
            var name = req.body.name;
            connection.query("INSERT INTO directions (`code`, `direction`) VALUES ('"+code+"','"+name+"')",(err,rows,fields)=>{
                if(err){
                    return err;
                    //cant set headers after they are sent
                    //res.send(true);
                    //res.end();
                }
                connection.query("SELECT id,code,direction FROM directions",(err,rows,fields)=>{
                    res.send(rows);
                    res.end();
                });

            });        
        })
        app.post('/changeDirection',(req,res)=>{   
            var code = req.body.code;
            var name = req.body.name;
            var id = req.body.id;
            connection.query("UPDATE `directions` SET `code`='"+code+"',`direction`='"+name+"' where id="+id,(err,rows,fields)=>{
                if(err){
                    return err;
                }
                connection.query("SELECT id,code,direction FROM directions",(err,rows,fields)=>{
                    res.send(rows);
                    res.end();
                });
            });        
        })
        app.post('/deleteDirection',(req,res)=>
        {   
            var query = '';
            for(let i = 0; i<req.body.length; i++){
                if(i != req.body.length-1)
                    query += req.body[i].id+', ';
                else
                    query += req.body[i].id;
            }
            connection.query("DELETE FROM `directions` where id IN ("+query+")",(err,rows,fields)=>{
                if(err){
                    return err;
                }
                connection.query("SELECT id,code,direction FROM directions",(err,rows,fields)=>{
                    res.send(rows);
                    res.end();
                });
            });     
        })
        app.get('/getAllDir',(req,res)=>{   
            connection.query("SELECT `direction`,`id` FROM `directions`",(err,rows,fields)=>{
                if(err){
                    return err;
                }
                res.send(rows);
                res.end();
            });        
        })
        /////////////////////////////////////////////////


       //Group page
       app.get('/groups',(req,res)=>{
        connection.query("SELECT groups.id,groups.year,groups.name,directions.direction FROM groups,directions WHERE groups.dir_id=directions.id",(err,rows,fields)=>{
            res.render('groups',{data:rows,user:str});
        });})

        app.post('/addGroup',(req,res)=>{ 
            var id = req.body.id;
            var year = req.body.year;
            var name = req.body.name;  
            connection.query("INSERT INTO `groups`(`dir_id`, `year`, `name`) VALUES ('"+id+"','"+year+"','"+name+"')",(err,rows,fields)=>{
                if(err){
                    return err;
                }
                connection.query("SELECT groups.id,groups.year,groups.name,directions.direction FROM groups,directions WHERE groups.dir_id=directions.id",(err,rows,fields)=>{
                    res.send(rows);
                    res.end();
                });
            });        
        })
        app.post('/changeGroup',(req,res)=>{ 
          
            var id = req.body.id;
            var year = req.body.year;
            var name = req.body.name;  
            var idDir = req.body.dir;
            console.log(id + "  " +idDir);
            connection.query("UPDATE groups SET `dir_id`="+idDir+",`year`="+year+",`name`='"+name+"' WHERE `id`="+id,(err,rows,fields)=>{
                if(err){
                    return err;
                }
                connection.query("SELECT groups.id,groups.year,groups.name,directions.direction FROM groups,directions WHERE groups.dir_id=directions.id",(err,rows,fields)=>{
                    res.send(rows);
                    res.end();
                });
            });        
        })
        app.post('/deleteGroup',(req,res)=>{ 
            var query = '';
            console.log(req.body)
            for(let i = 0; i<req.body.length; i++){
                if(i != req.body.length-1)
                    query += req.body[i].id+', ';
                else
                    query += req.body[i].id;
            }
            connection.query("DELETE FROM `groups` WHERE id IN ("+query+")",(err,rows,fields)=>{
                if(err){
                    return err;
                }
                connection.query("SELECT groups.id,groups.year,groups.name,directions.direction FROM groups,directions WHERE groups.dir_id=directions.id",(err,rows,fields)=>{
                    res.send(rows);
                    res.end();
                });
            });      
        })
        ///////////////////////////////////////////////////


        //Shedule page
        app.get('/schedule', (req, res) => {  
            res.render("schedule", {user:str});
        }); 
        app.get('/schedule_student', (req, res) => {  
            res.render("schedule_student", {user:str});
        });
        app.get('/schedule/teacher', (req, res) => {  
            res.render("schedule_teacher", {user:str});
        });
        ///////////////////////////////////////////////////


        //
        app.get('/submitmess', (req, res) => {  
            res.render("submitmess", {user:str});
        }); 

        app.post("/submitmess",(req,res)=>{         
            var id_c;
            connection.query("SELECT id, surname, name, lastname FROM users where username='"+req.session.passport.user+"'", function(err, rows, fields) {
             var aud = req.body['f[]'];
             var text = req.body.text;
             
              d = new Date()
              var date = d.getFullYear()+"-"+format(d.getMonth()+1)+"-"+format(d.getDate())+" "+format(d.getHours())+":"+format(d.getMinutes())
              if (aud=="all") {
                connection.query("INSERT into notices (user_id, text, time, audit) values ("+rows[0].id+", '"+
                  text+"' , '"+date+"', 'all')", function(err, rows, fields) {id_c = rows.insertId; })
              }
              else {
                 connection.query("INSERT into notices (user_id, text, time, audit) values ("+rows[0].id+", '"+
                  text+"' , '"+date+"', null)", function(err, rows, fields) {
                    id_c = rows.insertId;
                      for (var i=0; i< aud.length; i++) {
                        connection.query("INSERT into not_aud (not_id, group_id) values ("+rows.insertId+","+aud[i]+")",
                         function(err, rows, fields) {})
                     }
    
                  })
                 // 
              }
                        
               res.send({"id_c":id_c, "auth":rows[0].surname+ " "+rows[0].name+ " "+rows[0].lastname, "time":date, "message":text}) 
            }); 
        });

        app.get('/up/teacher', (req, res) => {  
            res.render("up_teacher", {user:str});
        }); 
        ////////////////////////////////////////

        //Marks page
        app.get('/marks', (req, res) => {  
            connection.query("SELECT * FROM groups order by year desc", function(err, rows, fields) {
                res.render('marks', {groups: rows, user:str})
            })
        });
        app.get('/marks/teacher', (req, res) => {  
            connection.query("SELECT * FROM groups order by year desc", function(err, rows, fields) {
                res.render('marks_teacher', {groups: rows, user:str})
            })
          });
          
          app.post('/marks/dis', (req, res) => { 
             group = req.body.group; 
             sem = req.body.sem;
            connection.query("SELECT t1.id, t1.dis, t1.control FROM dis as t1, groups as t2 where t1.year =t2.year and t1.dir_id = t2.dir_id and t2.name='"+group+"' and t1.sem="+sem, function(err, rows, fields) {
                res.send(rows)
            })
          });
          
          app.post('/marks/m', (req, res) => { 
             group = req.body.group; 
             dis = req.body.dis;
              connection.query("select users.id, concat(users.surname,' ', users.name,' ', users.lastname) as fio, marks2.mark, marks2.balls from users left join (SELECT * from marks where marks.dis_id="+dis+") marks2 on users.id=marks2.user_id where users.group_id="+group+" order by users.surname", function(err, rows, fields) {
                res.send(rows)
              })
          });
          
          app.post('/marks/sem', (req, res) => { 
            group = req.body.group; 
            connection.query("SELECT t1.sem FROM dis as t1, groups as t2 where t1.year =t2.year and t1.dir_id = t2.dir_id and t2.name='"+group+"' group by sem order by sem", function(err, rows, fields) {
                res.send(rows)
            })
          });
          
          app.post('/marks/update', (req, res) => { 
            dis   = req.body.dis; 
            marks = JSON.parse(req.body.marks);
          
            var values = []
            for (var i=0; i<marks.length; i++) {
              var j = []
              j.push(marks[i].user)
              j.push(dis)
              j.push(marks[i].mark)
              j.push(marks[i].balls)
              values.push(j)
            }
          
            var users = []
          
            for (var i=0; i<marks.length; i++) {
              users.push(marks[i].user)
            }
          
            connection.query("DELETE from marks where dis_id ="+dis+" and user_id IN (?)", [users], function(err, rows, fields) {
              connection.query("INSERT into marks (user_id, dis_id, mark, balls) VALUES ?", [values], function(err, rows, fields) {
                res.send("Успешно!")
            })})
            
        });
        ///////////////////////////////////////

        app.get('/subjects', (req, res) => {  
            res.render("subjects", {user:str});
          }); 
          
          app.get('/subjects/sem', (req, res) => { 
            
            if (req.session.passport) {
            user = req.session.passport.user;
            console.log(user);
            connection.query("SELECT id, group_id FROM users where username='"+user+"' ", function(err, rows, fields) {
                      if (rows[0]) {
                        var id = rows[0].group_id;
                        var user_id = rows[0].id;
                          }
                      connection.query("SELECT dir_id, year FROM groups where id="+id, function(err, rows, fields) {
                        var year = rows[0].year;
                        var dir = rows[0].dir_id;
                        connection.query("SELECT t1.sem FROM dis as t1, groups as t2 where t1.year =t2.year and t1.dir_id = t2.dir_id and t2.id='"+id+"' group by sem order by sem", function(err, rows, fields) {
                            res.send({"sem":rows, "year":year, "id":user_id, "dir":dir})
                        }) 
                      })
                    }); 
            }
            else
            {
              res.send("login")
            }});
          
          app.post('/subjects/sub', (req, res) => { 
            user = req.body.user;
            dir = req.body.dir;
            year = req.body.year;
          
            connection.query("select dis.dis, dis.choise, dis.sem, dis.lek, dis.pr, dis.lab, dis.control, marks2.mark, marks2.balls from dis left join (SELECT * from marks where marks.user_id="+user+") marks2 on dis.id=marks2.dis_id where dis.dir_id="+dir+" and dis.year="+year, function(err, rows, fields) {
                res.send(rows)
            })
          }); 
          
          app.post('/deletenote', (req, res) => { 
            id = req.body.id;
            connection.query("delete from notices where id="+id, function(err, rows, fields) {
                res.send("")
            })
          });  
    }