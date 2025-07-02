const DashboardDAO = require('../dao/Dashboard-dao');

exports.getOfficerCount = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {

    console.log('userdata', req.user);
    const centerId = req.user.centerId;
    const companyId = req.user.companyId;
    const userId = req.user.userId;


    console.log(centerId);

    const COOCount = await DashboardDAO.getCollectionOfficerCountDetails(centerId, companyId, userId);
    console.log('COOCount', COOCount)
    const CUOCount = await DashboardDAO.getCustomerOfficerCountDetails(centerId, companyId, userId);
    const activities = await DashboardDAO.getActivityDetails();

    res.json({ COOCount, CUOCount, activities });
  } catch (err) {
    console.error('Error getting officer count', err);
    res.status(500).json({ error: 'Error getting officer count' });
  }
};


exports.getChart = async (req, res) => {
  try {

    const centerId = req.user.centerId
    const dateFilter = req.query.filter

    const chartData = await DashboardDAO.getChartDetails(centerId, dateFilter);
    res.json(chartData)
  } catch (err) {
    console.error('Error fetching market details', err);
    res.status(500).json({ error: 'Error fetching market details' });
  }
};





