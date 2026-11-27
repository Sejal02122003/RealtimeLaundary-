const express = require('express');
const { Service, Offer, SERVICE_CATEGORIES, PRICING_MODELS } = require('../../models/Catalog');
const { getSettings } = require('../../models/Settings');
const { requireId } = require('../../utils/query');
const { HttpError, text, parseWholeNumber } = require('../../utils/http');

const router = express.Router();

const price = (value) => parseWholeNumber(value, { label: 'Price', min: 1, max: 100000 });

function boolean(value) {
  if (typeof value !== 'boolean') throw new HttpError(400, 'Invalid request');
  return value;
}

async function catalog() {
  const [services, offers, settings] = await Promise.all([
    Service.find().sort({ _id: 1 }),
    Offer.find().sort({ _id: 1 }),
    getSettings(),
  ]);
  return {
    categories: SERVICE_CATEGORIES,
    pricingModels: PRICING_MODELS,
    services: services.map((s) => ({
      id: s.id,
      category: s.category,
      name: s.name,
      pricingModel: s.pricingModel,
      price: s.price,
      available: s.available,
    })),
    slots: settings.slots.map(({ id, label, open }) => ({ id, label, open })),
    rules: {
      minOrder: settings.orderRules.minOrder,
      taxRate: settings.orderRules.taxRate,
      codEnabled: settings.orderRules.codEnabled,
    },
    offers: offers.map((o) => ({
      id: o.id,
      code: o.code,
      type: o.type,
      value: o.value,
      minimum: o.minimum,
      firstOrderOnly: o.firstOrderOnly,
      active: o.active,
    })),
  };
}

const respond = async (res, status = 200) => res.status(status).json(await catalog());

router.get('/', (_req, res) => respond(res));

router.post('/services', async (req, res) => {
  const category = text(req.body?.category);
  const pricingModel = text(req.body?.pricingModel);
  const name = text(req.body?.name);
  if (!Object.hasOwn(SERVICE_CATEGORIES, category)) throw new HttpError(400, 'Choose a category');
  if (!Object.hasOwn(PRICING_MODELS, pricingModel)) throw new HttpError(400, 'Choose a pricing model');
  if (!name || name.length > 60) throw new HttpError(400, 'Enter a service name (up to 60 characters)');

  try {
    await Service.create({ category, pricingModel, name, price: price(req.body?.price) });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'This service already exists in the category');
    throw err;
  }
  await respond(res, 201);
});

router.patch('/services/:id', async (req, res) => {
  const update = {};
  if (req.body?.price !== undefined) update.price = price(req.body.price);
  if (req.body?.available !== undefined) update.available = boolean(req.body.available);
  const service = await Service.findByIdAndUpdate(requireId(req.params.id, 'Service'), update);
  if (!service) throw new HttpError(404, 'Service not found');
  await respond(res);
});

router.patch('/slots/:id', async (req, res) => {
  const settings = await getSettings();
  const slot = settings.slots.find((s) => s.id === req.params.id);
  if (!slot) throw new HttpError(404, 'Slot not found');
  slot.open = boolean(req.body?.open);
  await settings.save();
  await respond(res);
});

router.patch('/rules', async (req, res) => {
  const settings = await getSettings();
  settings.orderRules = {
    minOrder: parseWholeNumber(req.body?.minOrder, { label: 'Minimum order value', min: 0, max: 100000 }),
    taxRate: parseWholeNumber(req.body?.taxRate, { label: 'Tax rate', min: 0, max: 50 }),
    codEnabled: boolean(req.body?.codEnabled),
  };
  await settings.save();
  await respond(res);
});

router.post('/offers', async (req, res) => {
  const code = text(req.body?.code).toUpperCase();
  if (!/^[A-Z0-9]{3,20}$/.test(code)) {
    throw new HttpError(400, 'The code needs 3 to 20 letters or numbers, with no spaces');
  }
  const type = text(req.body?.type);
  if (!['flat', 'percent'].includes(type)) throw new HttpError(400, 'Choose a discount type');
  const value = parseWholeNumber(req.body?.value, {
    label: type === 'flat' ? 'Discount amount' : 'Discount percent',
    min: 1,
    max: type === 'flat' ? 100000 : 100,
  });
  const minimum = parseWholeNumber(req.body?.minimum || 0, { label: 'Minimum order', min: 0, max: 100000 });

  try {
    await Offer.create({ code, type, value, minimum, firstOrderOnly: boolean(req.body?.firstOrderOnly) });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'This offer code already exists');
    throw err;
  }
  await respond(res, 201);
});

router.patch('/offers/:id', async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(requireId(req.params.id, 'Offer'), {
    active: boolean(req.body?.active),
  });
  if (!offer) throw new HttpError(404, 'Offer not found');
  await respond(res);
});

module.exports = router;
