const express = require('express')
const { getItemCategory, getItemCode, getItemColors, getItemFabric, getItemWeave, getItemSize, getItemOcassion, getItemSaree, getItemCountry } = require('../controllers/adminItemController')
const router = express.Router()

router.get('/category',getItemCategory);
router.get('/code',getItemCode);
router.get('/color',getItemColors);
router.get("/fabric",getItemFabric);
router.get('/weave',getItemWeave)
router.get('/size',getItemSize)
router.get('/size',getItemSize)
router.get('/ocassion',getItemOcassion)
router.get('/saree',getItemSaree)
router.get('/country',getItemCountry)


module.exports = router;