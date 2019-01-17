const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fileUpload = require("express-fileupload"); //for file download
const mysql = require("mysql"); //base de donnée
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");

//creation of the application:
const app = express();

//call of the database
const connection = mysql.createConnection({
  host: "",
  user: "",
  password: "",
  database: "react-umons-project"
});

connection.connect(err => {
  if (err) {
    return err;
  }
});

//enhance the app
app.use(helmet()); //for enhance the security
app.use(bodyParser.json()); // to parse application/json content-type
app.use(cors()); // enable all cors requests: accepts requests coming from other origins -> Cross-Origin Resource sharing
app.use(morgan("combined")); //log http request -> go chercher détails sur combined
app.use(fileUpload()); // the name is quite explicit
app.use(bodyParser.urlencoded({ extended: true }));
//for storing images:
app.use("/public", express.static(__dirname + "/public"));

//
// info related to token and auth
//
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://handle.eu.auth0.com/.well-known/jwks.json"
  }),
  //Validate the audience and issuer.
  audience: "3j0V4vab7ojAFT644uTInEu3QJDCaSZ4",
  issuer: "htts://handle.eu.auth0.com/",
  algorithms: ["RS256"]
});

//
//create different pages:
//

/**********************default **********************/
app.get("/", (req, res) => {
  console.log("connection on the api");
  res.send("<p> Welcome on the API</p>");
});
/****** housing pictures *****/

app.get("/housingPictures", (req, res) => {
  console.log("send housing pictures");
  const SELECT_ALL_HOUSINGPICTURES_QUERY = "SELECT * FROM housingPictures";

  connection.query(SELECT_ALL_HOUSINGPICTURES_QUERY, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      return res.json({
        data: results
      });
    }
  });
});

app.post(
  "/housingPictures/add",
  /* checkJwt,*/ (req, res, next) => {
    let { file } = req.files;
    console.log(file);
    const { owner, housing } = req.body;
    console.log(req.body);
    const INSERT_HOUSINGPICTURES_QUERY = `INSERT INTO housingPictures(housing) VALUES(${housing})`;
    console.log(INSERT_HOUSINGPICTURES_QUERY);
    console.log("my dir: " + __dirname);

    connection.query(INSERT_HOUSINGPICTURES_QUERY, err => {
      if (err) {
        console.log("error");
        return res.send(err);
      } else {
        console.log("succes");
        connection.query("SELECT LAST_INSERT_ID()", (err, result) => {
          console.log(result);
          avoidRowData = result.map(row => ({ ...row }))[0];
          my_image = Object.values(avoidRowData);
          lempd = my_image[0];
          file.mv(`${__dirname}/public/${lempd}.jpg`, err => {
            if (err) {
              return res.status(500).send(err);
            } else {
              return res.status(200).send();
            }
            //res.json({ file: `public/tmp.jpg` });
          });
        });
        //res.send("image sucessfully added");
        return res.status(200).send();
      }
    });

    /**/
  }
);

//https://stackoverflow.com/questions/27895329/why-error-cant-set-headers-after-they-are-sent

/************* housing ******************/
app.get("/housing", (req, res) => {
  console.log("send housing");
  const SELECT_ALL_HOUSING_QUERY = "SELECT * FROM housing";
  connection.query(SELECT_ALL_HOUSING_QUERY, (err, results) => {
    if (err) {
      return res.send(err);
    } else {
      res.json({ data: results });
    }
  });
});

app.post("/housing/add", (req, res) => {
  const { title, description, price, address, owner } = req.body;
  const INSERT_HOUSING_QUERY = `INSERT INTO housing(title, description, price, address, owner) VALUES('${title}', '${description}','${price}','${address}',${owner})`;
  connection.query(INSERT_HOUSING_QUERY, (err, results) => {
    if (err) {
      console.log("error");
      return res.send(err);
    } else {
      return res.status(200).send();
    }
  });
});

//make the api reachable:
const port = 4000; //most of the time, it is 3000 but it is than react
app.listen(port, () => {
  console.log("api listening on port :" + port);
});
