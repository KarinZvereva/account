const mysql  = require('mysql');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'accountisu'
  });

var format = function(day) {
      day = day.toString();
      if (day.length==1) return '0'+day;
      return day;
    }

module.exports = function(app){

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

app.get('/marks', (req, res) => {  
  connection.query("SELECT * FROM groups order by year desc", function(err, rows, fields) {
      res.render('marks', {groups: rows, user:req.user.username})
  })
});

app.get('/marks/teacher', (req, res) => {  
  connection.query("SELECT * FROM groups order by year desc", function(err, rows, fields) {
      res.render('marks_teacher', {groups: rows, user:req.user.username})
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
  })
  })
  
});



app.get('/subjects', (req, res) => {  
  res.render("subjects", {user:req.user.username});
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
  }

  
});


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