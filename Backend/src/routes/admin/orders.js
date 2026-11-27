const path = require('node:path');
const express = require('express');
const { Order, STAGES, STAGE } = require('../../models/Order');
const { Job } = require('../../models/Job');
const { Driver } = require('../../models/Driver');
const orders = require('../../services/orders');
const { driverStats } = require('../../services/driverStats');
const { sendUpload } = require('../../utils/sendUpload');
const { contains, pageLimit, requireId } = require('../../utils/query');
const { HttpError, text, parseWholeNumber } = require('../../utils/http');

const router = express.Router();

const openJobCodes = () => Job.distinct('orderId', { status: { $in: orders.OPEN_JOB } });

async function listFilter(filter) {
  switch (filter) {
    case 'needs-driver':
      return {
        cancelled: false,
        stage: { $in: [STAGE.BOOKED, STAGE.READY] },
        code: { $nin: await openJobCodes() },
      };
    case 'in-progress':
      return { cancelled: false, stage: { $gte: STAGE.PICKUP_ASSIGNED, $lte: STAGE.READY } };
    case 'out-for-delivery':
      return { cancelled: false, stage: STAGE.OUT_FOR_DELIVERY };
    case 'delivered':
      return { cancelled: false, stage: STAGE.DELIVERED };
    case 'refunds':
      return { refundRequest: { $ne: null } };
    default:
      return {};
  }
}

/** The driver shown against an order: nobody if the next trip is still unassigned. */
function shownDriver(order, covered) {
  const waiting = order.stage === STAGE.BOOKED || order.stage === STAGE.READY;
  if (!order.cancelled && waiting && !covered.has(order.code)) return '';
  return order.driverName;
}

const summary = (order, covered) => ({
  code: order.code,
  customerName: order.customerName,
  total: order.total,
  method: order.payment.method,
  stage: order.stage,
  cancelled: order.cancelled,
  driverName: shownDriver(order, covered),
});

router.get('/', async (req, res) => {
  const filter = await listFilter(text(req.query.filter));
  const q = text(req.query.q).replace(/^#/, '');
  if (q) {
    const match = contains(q);
    const digits = q.replace(/\D/g, '');
    filter.$or = [{ code: match }, { customerName: match }];
    if (digits.length >= 4) filter.$or.push({ phone: contains(digits) });
  }

  const [rows, total, covered] = await Promise.all([
    Order.find(filter).sort({ placedAt: -1 }).limit(pageLimit(req.query.limit)),
    Order.countDocuments(filter),
    openJobCodes(),
  ]);
  const coveredSet = new Set(covered);
  res.json({ orders: rows.map((order) => summary(order, coveredSet)), total });
});

async function findOrder(code) {
  const order = await Order.findOne({ code: text(code) });
  if (!order) throw new HttpError(404, 'Order not found');
  return order;
}

async function detail(order) {
  const [jobs, drivers, statsFor] = await Promise.all([
    Job.find({ orderId: order.code }).sort({ createdAt: -1 }),
    Driver.find({ status: 'approved', online: true }).sort({ name: 1 }),
    driverStats(),
  ]);
  const openJob = jobs.find((job) => orders.OPEN_JOB.includes(job.status));
  const covered = new Set(openJob ? [order.code] : []);

  return {
    ...summary(order, covered),
    area: order.area,
    address: order.address,
    phone: order.phone,
    service: order.service,
    pieces: order.pieces,
    instructions: order.instructions,
    paid: order.payment.paid,
    refunded: order.refunded,
    refundRequest: order.refundRequest,
    // Which trip a driver can be assigned to now, and the state of the current one.
    leg: orders.legFor(order),
    openJob: openJob ? { type: openJob.type, status: openJob.status, driverId: openJob.driver } : null,
    proof: Object.fromEntries(
      ['pickup', 'delivery'].map((type) => [
        type,
        jobs.some((job) => job.type === type && job.status === 'done' && job.photo),
      ]),
    ),
    drivers: drivers
      .map((driver) => ({ id: driver.id, name: driver.name, jobs: statsFor(driver._id).openJobs }))
      .sort((a, b) => a.jobs - b.jobs || a.name.localeCompare(b.name)),
  };
}

const respond = async (res, code) => res.json({ order: await detail(await findOrder(code)) });

router.get('/:code', (req, res) => respond(res, req.params.code));

router.post('/:code/assign', async (req, res) => {
  const order = await findOrder(req.params.code);
  const driver = await Driver.findById(requireId(req.body?.driverId, 'Driver'));
  if (!driver || driver.status !== 'approved') throw new HttpError(409, 'This driver is not active');
  if (!driver.online) throw new HttpError(409, 'This driver is offline');
  await orders.assignDriver(order, driver);
  await respond(res, order.code);
});

router.post('/:code/status', async (req, res) => {
  const stage = parseWholeNumber(req.body?.stage, { label: 'Status', min: 0, max: STAGES.length - 1 });
  const order = await findOrder(req.params.code);
  await orders.setStage(order, stage);
  await respond(res, order.code);
});

router.post('/:code/cancel', async (req, res) => {
  const order = await findOrder(req.params.code);
  await orders.cancelOrder(order);
  await respond(res, order.code);
});

router.post('/:code/refund', async (req, res) => {
  const order = await findOrder(req.params.code);
  const left = order.total - order.refunded;
  if (left < 1) throw new HttpError(409, 'This order is already fully refunded');
  const amount = parseWholeNumber(req.body?.amount, { label: 'Refund', min: 1, max: left });
  const reason = text(req.body?.reason);
  if (!reason || reason.length > 200) throw new HttpError(400, 'Enter a reason (up to 200 characters)');
  await orders.refundOrder(order, amount, reason);
  await respond(res, order.code);
});

router.post('/:code/refund-request/reject', async (req, res) => {
  const order = await findOrder(req.params.code);
  if (!order.refundRequest) throw new HttpError(409, 'There is no open refund request');
  order.refundRequest = null;
  await order.save();
  await respond(res, order.code);
});

router.get('/:code/photos/:type', async (req, res) => {
  const job = await Job.findOne({
    orderId: text(req.params.code),
    type: text(req.params.type),
    status: 'done',
    photo: { $exists: true },
  }).sort({ closedAt: -1 });
  if (!job) throw new HttpError(404, 'No photo yet');
  await sendUpload(res, path.posix.normalize(job.photo));
});

module.exports = router;
