const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { admin, plantcare, collectionofficer, marketPlace, dash } = require('./startup/database');

// Base API path constant
const BASE_API_PATH = '/agro-api/collection-center-api';

//routers
const AuthRoutes = require('./routes/Auth');
const ManageOffcerRoutes = require('./routes/ManageOfficers');
const PriceListRoutes = require('./routes/PriceList');
const ReportRoutes = require('./routes/Report');
const TargetRoutes = require('./routes/Target');
const ComplaintRoutes = require('./routes/Complaints')
const DashbordRoutes = require('./routes/Dashboards')
const heathRoutes = require('./routes/healthRoutes')


const app = express();
const port = process.env.PORT || 5000;
app.use(cors({
  origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//DB connections
admin.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database in index.js (admin):', err);
    return;
  }
  console.log('Connected to the MySQL database in server.js (admin).');
  connection.release();
});

plantcare.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database in index.js (plantcare):', err);
    return;
  }
  console.log('Connected to the MySQL database in server.js (plantcare).');
  connection.release();
});

collectionofficer.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database in index.js (collectionofficer):', err);
    return;
  }
  console.log('Connected to the MySQL database in server.js.(collectionofficer)');
  connection.release();
});

marketPlace.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database in index.js (marketPlace):', err);
    return;
  }
  console.log('Connected to the MySQL database in server.js.(marketPlace)');
  connection.release();
});

dash.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database in index.js (dash):', err);
    return;
  }
  console.log('Connected to the MySQL database in server.js.(dash)');
  connection.release();
});




app.use(`${BASE_API_PATH}/test`, (req, res) => {
  res.json("Testing run!")
})
app.use(`${BASE_API_PATH}/api/auth`, AuthRoutes);
app.use(`${BASE_API_PATH}/api/manage-officers`, ManageOffcerRoutes);
app.use(`${BASE_API_PATH}/api/price-list`, PriceListRoutes);
app.use(`${BASE_API_PATH}/api/report`, ReportRoutes);
app.use(`${BASE_API_PATH}/api/target`, TargetRoutes);
app.use(`${BASE_API_PATH}/api/complaint`, ComplaintRoutes);
app.use(`${BASE_API_PATH}/api/dashboard`, DashbordRoutes);

app.use(`${BASE_API_PATH}`, heathRoutes);



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});



