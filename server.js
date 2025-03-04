const express = require('express');
require('dotenv').config();
const cors = require('cors');
const {  plantcare, collectionofficer, marketPlace, dash } = require('./startup/database');

// Base API path constant
const BASE_API_PATH = '/agro-api/collection-center-api';

//routers
const AuthRoutes = require('./routes/Auth');
const ManageOffcerRoutes  = require('./routes/ManageOfficers');
const PriceListRoutes = require('./routes/PriceList');
const ReportRoutes = require('./routes/Report');
const TargetRoutes  =require('./routes/Target');
const ComplaintRoutes = require('./routes/Complaints')


const app = express();
const port = process.env.PORT || 5000;
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

plantcare.connect(err => {
    if (err) {
      console.error('Error connecting to the database in index.js (plantcare):', err);
      return;
    }
    console.log('Connected to the MySQL database in server.js.(plantcare)');
  });
  
  collectionofficer.connect(err => {
    if (err) {
      console.error('Error connecting to the database in index.js (collectionofficer):', err);
      return;
    }
    console.log('Connected to the MySQL database in server.js.(collectionofficer)');
  });
  
  marketPlace.connect(err => {
    if (err) {
      console.error('Error connecting to the database in index.js (marketPlace):', err);
      return;
    }
    console.log('Connected to the MySQL database in server.js.(marketPlace)');
  });
  
  dash.connect(err => {
    if (err) {
      console.error('Error connecting to the database in index.js (dash):', err);
      return;
    }
    console.log('Connected to the MySQL database in server.js.(dash)');
  });



app.use(`${BASE_API_PATH}/test`, (req, res) => {
    res.json("Testing run!")
})
app.use(`${BASE_API_PATH}/auth`, AuthRoutes);
app.use(`${BASE_API_PATH}/manage-officers`, ManageOffcerRoutes);
app.use(`${BASE_API_PATH}/price-list`, PriceListRoutes);
app.use(`${BASE_API_PATH}/report`, ReportRoutes);
app.use(`${BASE_API_PATH}/target`, TargetRoutes);
app.use(`${BASE_API_PATH}/complaint`, ComplaintRoutes);


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
