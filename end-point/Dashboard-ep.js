const DashboardDAO = require('../dao/Dashboard-dao');

exports.getOfficerCount = async (req, res) => {
  try {
    const centerId = req.user.centerId;

    const COOCount = await DashboardDAO.getCollectionOfficerCountDetails(centerId);
    const CUOCount = await DashboardDAO.getCustomerOfficerCountDetails(centerId);
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





