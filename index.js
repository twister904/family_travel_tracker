import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3001;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "mjworld",
  password: "mazhar@2472",
  port: 5432
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentuserid = 1;

let users = [];

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries join users on users.id=user_id where user_id=$1",[currentuserid]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
async function getcurrentuser(){
  const result=await db.query("select *from users");
  users=result.rows;
  return users.find((user)=>user.id==currentuserid);
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentuser=await getcurrentuser();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentuser.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentuser=await getcurrentuser();
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2);",
        [countryCode,currentuserid]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if(req.body.add==="new"){
    res.render("new.ejs");  }
    else{
      currentuserid=req.body.user;
      res.redirect("/");
    }
});

app.post("/new", async (req, res) => {
const name=req.body.name;
const color=req.body.color;
const result=await db.query("insert into users (name,color) values ($1,$2) returning *;",[name,color]);
const id=result.rows[0].id;
currentuserid=id;
res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
