import QRCode from 'qrcode';
import { queryGet, queryRun } from '../database/db.js';
import { calculateFinalPrice } from '../routes/productRoutes.js';

// Decoded credentials from verified PhonePe UPI QR
const DEFAULT_UPI_ID = '9507677590@axl';
const DEFAULT_UPI_NAME = 'LILA DEVI';
const DEFAULT_MERCHANT_CODE = '0000';
const DEFAULT_MODE = '02';
const DEFAULT_PURPOSE = '00';
const DEFAULT_CURRENCY = 'INR';

export const getUpiConfig = () => ({
  payeeUpiId: (process.env.UPI_PAYEE_ID || DEFAULT_UPI_ID).trim(),
  payeeName: (process.env.UPI_PAYEE_NAME || DEFAULT_UPI_NAME).trim(),
  merchantCode: (process.env.UPI_MERCHANT_CODE || DEFAULT_MERCHANT_CODE).trim(),
  mode: (process.env.UPI_MODE || DEFAULT_MODE).trim(),
  purpose: (process.env.UPI_PURPOSE || DEFAULT_PURPOSE).trim(),
  currency: (process.env.UPI_CURRENCY || DEFAULT_CURRENCY).trim()
});

/**
 * Server-authoritative calculation of cart items total amount.
 * Never trusts frontend prices or totals.
 * Uses integer paise to eliminate floating-point rounding errors.
 */
export const calculateOrderAmount = async (items, userType = 'Customer') => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty. Please add items to checkout.');
  }

  let totalPaise = 0;
  const itemsBreakdown = [];

  for (const item of items) {
    const productId = parseInt(item.productId || item.id, 10);
    const quantity = parseInt(item.quantity, 10);

    if (isNaN(productId) || productId <= 0) {
      throw new Error(`Invalid product ID in checkout.`);
    }

    if (isNaN(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity for product ID ${productId}. Quantity must be at least 1.`);
    }

    if (quantity > 1000) {
      throw new Error(`Quantity exceeds maximum order limit for product ID ${productId}.`);
    }

    // Fetch authoritative product record directly from the database
    const product = await queryGet('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      throw new Error(`Product #${productId} not found in catalog.`);
    }

    const isActive = (product.productStatus || 'Active') === 'Active';
    if (!isActive) {
      throw new Error(`Product "${product.name}" is currently inactive and cannot be purchased.`);
    }

    if (product.inStock === 0 || product.inStock === false) {
      throw new Error(`Product "${product.name}" is currently Out of Stock.`);
    }

    // Role-isolated price determination matching the platform's pricing rules
    let unitPrice = 0;
    if (userType === 'Distributor') {
      if (product.distributorPrice !== null && product.distributorPrice !== undefined && Number(product.distributorPrice) > 0) {
        unitPrice = Number(product.distributorPrice);
      } else if (product.distributorOriginalPrice && Number(product.distributorOriginalPrice) > 0) {
        unitPrice = calculateFinalPrice(product.distributorOriginalPrice, product.distributorDiscount || 0);
      } else {
        unitPrice = product.customerPrice !== null && Number(product.customerPrice) > 0
          ? Number(product.customerPrice)
          : calculateFinalPrice(product.customerOriginalPrice || product.originalPrice, product.customerDiscount || 0);
      }
    } else {
      // Customer role
      if (product.customerPrice !== null && product.customerPrice !== undefined && Number(product.customerPrice) > 0) {
        unitPrice = Number(product.customerPrice);
      } else if (product.customerOriginalPrice && Number(product.customerOriginalPrice) > 0) {
        unitPrice = calculateFinalPrice(product.customerOriginalPrice, product.customerDiscount || 0);
      } else {
        unitPrice = Number(product.price) || calculateFinalPrice(product.originalPrice, product.discount || 0);
      }
    }

    if (unitPrice <= 0) {
      throw new Error(`Product "${product.name}" has an invalid price.`);
    }

    // Integer paise calculation: ₹1.00 = 100 paise
    const unitPaise = Math.round(unitPrice * 100);
    const itemPaise = unitPaise * quantity;
    totalPaise += itemPaise;

    itemsBreakdown.push({
      productId: product.id,
      name: product.name,
      category: product.category,
      sku: product.sku,
      unitPrice: unitPaise / 100,
      quantity,
      subtotal: itemPaise / 100
    });
  }

  if (totalPaise <= 0) {
    throw new Error('Total order amount must be greater than zero.');
  }

  const totalAmount = totalPaise / 100;

  return {
    totalAmount,
    totalPaise,
    totalFormatted: totalAmount.toFixed(2),
    itemsBreakdown
  };
};

/**
 * Builds standard NPCI UPI payment URI with order reference and exact price
 */
export const buildUpiUri = ({ amount, paymentReference, note }) => {
  const config = getUpiConfig();
  const amountStr = Number(amount).toFixed(2);

  // Parameter keys specified by NPCI UPI specifications
  const params = new URLSearchParams();
  params.set('pa', config.payeeUpiId);
  params.set('pn', config.payeeName);
  params.set('mc', config.merchantCode);
  params.set('mode', config.mode);
  params.set('purpose', config.purpose);
  params.set('am', amountStr);
  params.set('cu', config.currency);
  params.set('tn', note || `MWS Eagle ${paymentReference}`);
  params.set('tr', paymentReference);

  return `upi://pay?${params.toString()}`;
};

/**
 * Creates dynamic, order-specific UPI QR payment attempt
 */
export const createDynamicPaymentAttempt = async ({ items, user = null, orderNumber = null }) => {
  const userType = user?.userType || 'Customer';
  const { totalAmount, totalPaise, totalFormatted, itemsBreakdown } = await calculateOrderAmount(items, userType);

  // Generate unique payment attempt reference (e.g. MWS-PAY-LX28A-9812)
  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const timeSuffix = Date.now().toString(36).toUpperCase();
  const paymentReference = `MWS-PAY-${timeSuffix}-${randSuffix}`;

  const config = getUpiConfig();
  const upiUri = buildUpiUri({
    amount: totalAmount,
    paymentReference,
    note: `Order ${orderNumber || paymentReference} MWS Eagle`
  });

  // Generate crisp QR code data URL (PNG)
  const qrCodeDataUrl = await QRCode.toDataURL(upiUri, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    scale: 8,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  // 30 minute TTL for the dynamic payment session
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  const createdDate = now.toISOString();

  // Persist attempt into database
  await queryRun(
    `INSERT INTO payment_attempts (
      paymentReference, orderNumber, userId, customerEmail, userType,
      amount, currency, payeeUpiId, payeeName, upiUri, status,
      itemsJson, expiresAt, createdDate, updatedDate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)`,
    [
      paymentReference,
      orderNumber || null,
      user?.userId || (user?.id ? String(user.id) : null),
      user?.email || null,
      userType,
      totalAmount,
      config.currency,
      config.payeeUpiId,
      config.payeeName,
      upiUri,
      JSON.stringify(itemsBreakdown),
      expiresAt,
      createdDate,
      createdDate
    ]
  );

  return {
    success: true,
    paymentReference,
    amount: totalAmount,
    amountPaise: totalPaise,
    amountFormatted: totalFormatted,
    currency: config.currency,
    payeeUpiId: config.payeeUpiId,
    payeeName: config.payeeName,
    upiUri,
    qrCodeDataUrl,
    expiresAt,
    status: 'PENDING',
    itemsBreakdown
  };
};

/**
 * Retrieve status of payment attempt
 */
export const getPaymentAttemptStatus = async (paymentReference) => {
  if (!paymentReference) {
    throw new Error('Payment reference is required.');
  }

  const payment = await queryGet('SELECT * FROM payment_attempts WHERE paymentReference = ?', [paymentReference]);
  if (!payment) {
    return null;
  }

  // Check expiration
  if (payment.status === 'PENDING' && payment.expiresAt && new Date(payment.expiresAt) < new Date()) {
    await queryRun('UPDATE payment_attempts SET status = "EXPIRED", updatedDate = ? WHERE id = ?', [
      new Date().toISOString(),
      payment.id
    ]);
    payment.status = 'EXPIRED';
  }

  return payment;
};

/**
 * Cancel a pending payment attempt (e.g. user modifies cart or backs out)
 */
export const cancelPaymentAttempt = async (paymentReference) => {
  const payment = await queryGet('SELECT * FROM payment_attempts WHERE paymentReference = ?', [paymentReference]);
  if (!payment) {
    return false;
  }

  if (payment.status === 'PENDING') {
    await queryRun('UPDATE payment_attempts SET status = "CANCELLED", updatedDate = ? WHERE id = ?', [
      new Date().toISOString(),
      payment.id
    ]);
    return true;
  }

  return false;
};
