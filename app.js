const express = require("express");
const mysql   = require("mysql");
var session = require('express-session');
var bodyParser = require('body-parser');

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public")); //folder for images, css, js
app.use(bodyParser.urlencoded({ extended: true })); //use to parse data sent using the POST method
app.use(bodyParser.json());

app.use(session({
  secret: '6wOBwJBStY'
}));

//routes

app.get("/dashboard", async function(req, res){
    
   let authorList = await getAuthorList();
   console.log(req.session.username);
   if (req.session && req.session.username && req.session.username.length) {
       res.render("dashboard", {
           "authorList":authorList,
           username: req.session.username
       });
   }
   else {
       delete req.session.username;
       res.redirect('/login');
   }
});



app.get("/login", function(req, res){
   res.render("login", {
       title: 'Login'
   });
});

app.get('/logout', function(req, res, next) {

    if (req.session && req.session.username && req.session.username.length) {
        delete req.session.username;
    }

    res.json({
        successful: true,
        message: ''
    });

});

app.post("/login", function(req, res){

    let successful = false;
    let message = '';
    
    if (req.body.username === "admin" && req.body.password === "admin") {
        successful = true;
        req.session.username = req.body.username;    
        console.log("success!")
    }
    else {
        // delete the user as punishment!
        delete req.session.username;
        message = 'Wrong username or password!';
        console.log("failed!");
    }
    
    console.log(req.session.username);

    // Return success or failure
    res.json({
        successful: successful,
        message: message
    });
});

app.get("/addAuthor", function(req, res){
    if (req.session && req.session.username && req.session.username.length) {
        res.render("newAuthor");
    }
    else {
       delete req.session.username;
       res.redirect('/login');
   }
});

app.post("/addAuthor", async function(req, res){
  //res.render("newAuthor");
  let rows = await insertAuthor(req.body);
  console.log(rows);
  //res.send("First name: " + req.body.firstName); //When using the POST method, the form info is stored in req.body
  let message = "Author WAS NOT added to the database!";
  if (rows.affectedRows > 0) {
      message= "Author successfully added!";
  }
  res.render("newAuthor", {"message":message});
    
});

app.get("/updateAuthor", async function(req, res){
    
    if (req.session && req.session.username && req.session.username.length) {
      let authorInfo = await getAuthorInfo(req.query.authorId);    
      //console.log(authorInfo);
      res.render("updateAuthor", {"authorInfo":authorInfo});
    }
    else {
       delete req.session.username;
       res.redirect('/login');
   }
});

app.post("/updateAuthor", async function(req, res){
  let rows = await updateAuthor(req.body);
  
  let authorInfo = req.body;
  console.log(rows);
  //res.send("First name: " + req.body.firstName); //When using the POST method, the form info is stored in req.body
  let message = "Author WAS NOT updated!";
  if (rows.affectedRows > 0) {
      message= "Author successfully updated!";
  }
  res.render("updateAuthor", {"message":message, "authorInfo":authorInfo});
    
});

app.get("/deleteAuthor", async function(req, res){
    if (req.session && req.session.username && req.session.username.length) {
     let rows = await deleteAuthor(req.query.authorId);
     console.log(rows);
      //res.send("First name: " + req.body.firstName); //When using the POST method, the form info is stored in req.body
      let message = "Author WAS NOT deleted!";
      if (rows.affectedRows > 0) {
          message= "Author successfully deleted!";
      }    
        
       let authorList = await getAuthorList();  
       //console.log(authorList);
       res.render("dashboard", {"authorList":authorList});
    }
    else {
       delete req.session.username;
       res.redirect('/login');
   }
});


//functions

function insertAuthor(body){
   
   let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `INSERT INTO l9_author
                        (firstName, lastName, sex)
                         VALUES (?,?,?)`;
        
           let params = [body.firstName, body.lastName, body.gender];
        
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
}

function updateAuthor(body){
   
   let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `UPDATE l9_author
                      SET firstName = ?, 
                          lastName  = ?, 
                                sex = ?
                     WHERE authorId = ?`;
        
           let params = [body.firstName, body.lastName, body.gender, body.authorId];
        
           console.log(sql);
           
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
}



function deleteAuthor(authorId){
   
   let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `DELETE FROM l9_author
                      WHERE authorId = ?`;
        
           conn.query(sql, [authorId], function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
}
function getAuthorInfo(authorId){
   
   let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT *
                      FROM l9_author
                      WHERE authorId = ?`;
        
           conn.query(sql, [authorId], function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows[0]); //Query returns only ONE record
           });
        
        });//connect
    });//promise 
}

function getAuthorList(){
   
   let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT authorId, firstName, lastName 
                        FROM l9_author
                        ORDER BY lastName`;
        
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
}

function dbConnection(){

   let conn = mysql.createConnection({
            host: 'gmgcjwawatv599gq.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
            user: 'bhp1to00zjadfjgx',
            password: 'ctverwyfcygontvb',
            database: 'k1n5umaw4l2zvlot'
       }); //createConnection

return conn;

}


//starting server
app.listen(process.env.PORT, process.env.IP, function(){
console.log("Express server is running...");
});
