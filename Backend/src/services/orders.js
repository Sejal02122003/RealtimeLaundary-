/**
 * Keeps orders and driver jobs in step. An admin changes an order and the driver
 * sees a job; a driver acts on a job and the order moves on.
 */
const { Order, STAGE } = require('../models/Order');
const { Job } = require('../models/Job');
const { Refund } = require('../models/Finance');
const { getSettings } = require('../models/Settings');
const { moveMoney } = require('./wallet');
const { createCommissions } = require('./commissions');
const { dayKey, atTime, addDays } = require('../utils/time');
const { HttpError } = require('../utils/http');

const OPEN_JOB = ['offered', 'assigned'];
const JOB_EARNING = 63;
const DELIVERY_BY = '18:30';

/** Which trip the order needs a driver for, or null if none right now. */
function legFor(order) {
  if (order.cancelled) return null;
  if (order.stage <= STAGE.PICKUP_ASSIGNED) return 'pickup';
  if (order.stage === STAGE.READY || order.stage === STAGE.OUT_FOR_DELIVERY) return 'delivery';
  return null;
}

const cancelJobs = (code, extra = {}) =>
  Job.updateMany(
    { orderId: code, status: { $in: OPEN_JOB }, ...extra },
    { status: 'cancelled', current: false, closedAt: new Date() },
  );

function assertOpen(order) {
  if (order.cancelled) throw new HttpError(409, 'This order is cancelled');
  if (order.stage === STAGE.DELIVERED) throw new HttpError(409, 'This order is already delivered');
}

/** Today if the time is still ahead, otherwise tomorrow. */
function nextDue(time) {
  const today = dayKey();
  const day = atTime(today, time) > new Date() ? today : addDays(today, 1);
  return { day, dueAt: atTime(day, time) };
}

async function assignDriver(order, driver) {
  assertOpen(order);
  const leg = legFor(order);
  if (!leg) throw new HttpError(409, 'Mark the order ready for delivery first');

  const { slots } = await getSettings();
  const slot = slots.find((s) => s.id === order.pickupSlot) ?? slots[0];
  const isPickup = leg === 'pickup';

  await cancelJobs(order.code);
  await Job.updateMany({ orderId: order.code, type: leg }, { current: false });
  try {
    await Job.create({
      orderId: order.code,
      type: leg,
      driver: driver._id,
      status: 'offered',
      ...nextDue(isPickup ? slot.end : DELIVERY_BY),
      slotLabel: isPickup ? slot.label : '',
      customer: {
        name: order.customerName,
        phone: order.phone,
        address: order.address,
        area: order.area,
        note: order.instructions,
      },
      service: order.service,
      pieces: order.pieces,
      otp: isPickup ? order.pickupOtp : order.deliveryOtp,
      payment: isPickup
        ? undefined
        : { method: order.payment.method, amount: order.payment.method === 'cod' ? order.total : 0 },
      earning: JOB_EARNING,
    });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'Another change was just made. Try again.');
    throw err;
  }

  order.driver = driver._id;
  order.driverName = driver.name;
  if (isPickup) order.stage = STAGE.PICKUP_ASSIGNED;
  await order.save();
}

async function setStage(order, stage) {
  assertOpen(order);
  if (stage === order.stage) return;

  // These two stages mean a driver is on the job, so one must exist.
  if (stage === STAGE.PICKUP_ASSIGNED || stage === STAGE.OUT_FOR_DELIVERY) {
    const type = stage === STAGE.PICKUP_ASSIGNED ? 'pickup' : 'delivery';
    const open = await Job.exists({ orderId: order.code, type, status: { $in: OPEN_JOB } });
    if (!open) throw new HttpError(409, 'Assign a driver first');
  }

  // Close the trips that no longer apply at the new stage.
  if (stage === STAGE.BOOKED || stage === STAGE.DELIVERED) {
    await cancelJobs(order.code);
  } else {
    if (stage >= STAGE.PICKED_UP) await cancelJobs(order.code, { type: 'pickup' });
    if (stage < STAGE.READY) await cancelJobs(order.code, { type: 'delivery' });
  }

  order.stage = stage;
  if (stage === STAGE.BOOKED) {
    order.driver = null;
    order.driverName = '';
  }
  if (stage === STAGE.DELIVERED) {
    order.deliveredAt = new Date();
    if (order.payment.method !== 'cod') order.payment.paid = true;
  }
  await order.save();
  if (stage === STAGE.DELIVERED) await createCommissions(order);
}

/** Returns money to the customer's wallet and records the refund. */
async function refundOrder(order, amount, reason) {
  if (!order.payment.paid) {
    throw new HttpError(409, 'No payment was received for this order');
  }
  // Reserving the amount first stops two refunds from exceeding the total.
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, refunded: { $lte: order.total - amount } },
    { $inc: { refunded: amount }, refundRequest: null },
    { returnDocument: 'after' },
  );
  if (!updated) throw new HttpError(409, 'The refund is more than what is left on this order');

  await Refund.create({ orderCode: order.code, customer: order.customer, amount, reason, at: new Date() });
  await moveMoney(order.customer, { type: 'refund', title: 'Order refund', detail: `#${order.code}`, amount });
  return updated;
}

async function cancelOrder(order) {
  assertOpen(order);
  const cancelled = await Order.findOneAndUpdate(
    { _id: order._id, cancelled: false, stage: { $lt: STAGE.DELIVERED } },
    { cancelled: true },
    { returnDocument: 'after' },
  );
  if (!cancelled) throw new HttpError(409, 'This order can no longer be cancelled');

  await cancelJobs(order.code);
  const due = cancelled.total - cancelled.refunded;
  if (cancelled.payment.paid && due > 0) await refundOrder(cancelled, due, 'Order cancelled');
}

/** Applies what a driver just did with a job to its order. */
async function syncFromJob(job) {
  const order = await Order.findOne({ code: job.orderId });
  if (!order || order.cancelled || order.stage === STAGE.DELIVERED) return;
  const isPickup = job.type === 'pickup';

  if (job.status === 'assigned') {
    if (!isPickup && order.stage === STAGE.READY) order.stage = STAGE.OUT_FOR_DELIVERY;
  } else if (['declined', 'missed', 'cancelled'].includes(job.status)) {
    if (String(order.driver) !== String(job.driver)) return;
    order.driver = null;
    order.driverName = '';
    if (isPickup && order.stage === STAGE.PICKUP_ASSIGNED) order.stage = STAGE.BOOKED;
    if (!isPickup && order.stage === STAGE.OUT_FOR_DELIVERY) order.stage = STAGE.READY;
  } else if (job.status === 'done') {
    if (isPickup) {
      order.pieces = job.pieces;
      if (order.stage <= STAGE.PICKUP_ASSIGNED) order.stage = STAGE.PICKED_UP;
    } else {
      order.stage = STAGE.DELIVERED;
      order.deliveredAt = job.closedAt;
      order.payment.paid =
        order.payment.method !== 'cod' || job.payment.cashStatus === 'collected';
    }
  }

  await order.save();
  if (order.stage === STAGE.DELIVERED) await createCommissions(order);
}

module.exports = { OPEN_JOB, legFor, assignDriver, setStage, cancelOrder, refundOrder, syncFromJob, cancelJobs };
