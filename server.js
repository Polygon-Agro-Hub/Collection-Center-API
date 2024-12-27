const express = require('express');
require('dotenv').config();
const cors = require('cors');
const db = require('./startup/database');

//routers
const AuthRoutes = require('./routes/Auth');
const ManageOffcerRoutes  = require('./routes/ManageOfficers');
const PriceListRoutes = require('./routes/PriceList');
const ReportRoutes = require('./routes/Report');


const app = express();
const port = process.env.PORT || 5000;
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database in index.js:', err);
        return;
    }
    console.log('Connected to the MySQL database in server.js.');
});



app.use('/api/test', (req, res) => {
    res.json("Testing run!")
})
app.use('/api/auth', AuthRoutes);
app.use('/api/manage-officers', ManageOffcerRoutes);
app.use('/api/price-list', PriceListRoutes);
app.use('/api/report', ReportRoutes);


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
