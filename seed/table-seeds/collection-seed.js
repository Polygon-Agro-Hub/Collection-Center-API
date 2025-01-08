const { createXlsxHistoryTable } = require('../tables/collection-table');
const { createMarketPriceTable } = require('../tables/collection-table');
const { createMarketPriceServeTable } = require('../tables/collection-table');
const { createCompany } = require('../tables/collection-table');
const { createCollectionOfficer } = require('../tables/collection-table');
const { createRegisteredFarmerPayments } = require('../tables/collection-table');
const { createFarmerPaymensCrops } = require('../tables/collection-table');
const { createCollectionCenter } = require('../tables/collection-table');
const { createFarmerComplains } = require('../tables/collection-table');
const { createMarketPriceRequestTable } = require('../tables/collection-table');




const {createAgroWorld} = require('../data/agroworldCompany')


const seedCollection = async () => {
    try {
    const messageXlsxHistory = await createXlsxHistoryTable();
    console.log(messageXlsxHistory);

    const messageMarketPrice = await createMarketPriceTable();
    console.log(messageMarketPrice);

    const messagecreateCollectionCenter = await createCollectionCenter();
    console.log(messagecreateCollectionCenter);

    const messageCreateCompany = await createCompany();
    console.log(messageCreateCompany);

    const messageCreateCollectionOfficer = await createCollectionOfficer();
    console.log(messageCreateCollectionOfficer);

    const messageCreateRegisteredFarmerPayments = await createRegisteredFarmerPayments();
    console.log(messageCreateRegisteredFarmerPayments);

    const messageCreateFarmerPaymensCrops = await createFarmerPaymensCrops();
    console.log(messageCreateFarmerPaymensCrops);

    const messagecreateFarmerComplains = await createFarmerComplains();
    console.log(messagecreateFarmerComplains);

    const messageMarketPriceServeTable = await createMarketPriceServeTable();
    console.log(messageMarketPriceServeTable);

    const messageCreateMarketPriceRequestTable = await createMarketPriceRequestTable();
    console.log(messageCreateMarketPriceRequestTable);






    
    const messagecreateAgroWorld = await createAgroWorld();
    console.log(messagecreateAgroWorld);

} catch (err) {
    console.error('Error seeding seedCollection:', err);
  }
};


module.exports = seedCollection;