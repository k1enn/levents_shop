import asyncHandler from "express-async-handler";
import crypto from "crypto";
import https from "https";
import Order from "../models/orderModel.js";

// @desc    Create MoMo payment
// @route   POST /api/payment/momo/create
// @access  Private
const createMomoPayment = asyncHandler(async (req, res) => {
  console.log("=== MoMo Payment Request Received ===");
  console.log("Request body:", req.body);

  const { amount, orderInfo, orderId } = req.body;

  // Validate required fields
  if (!amount || !orderInfo || !orderId) {
    console.log("Missing required fields:", { amount, orderInfo, orderId });
    res.status(400);
    throw new Error("Missing required payment information");
  }

  // MoMo configuration - using the exact values from MoMo documentation
  const accessKey = "F8BBA842ECF85";
  const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  const partnerCode = "MOMO";
  const redirectUrl = `http://localhost:3000/order-success?orderId=${orderId}`;
  const ipnUrl = "http://localhost:5000/api/payment/momo/ipn";
  const requestType = "payWithMethod";
  const requestId = orderId;
  const extraData = "";
  const orderGroupId = "";
  const autoCapture = true;
  const lang = "vi";

  console.log("--------------------CREATING MOMO PAYMENT----------------");
  console.log("Order ID:", orderId);
  console.log("Amount:", amount);
  console.log("Order Info:", orderInfo);

  // Create raw signature string - exact format from MoMo docs
  const rawSignature =
    "accessKey=" +
    accessKey +
    "&amount=" +
    amount +
    "&extraData=" +
    extraData +
    "&ipnUrl=" +
    ipnUrl +
    "&orderId=" +
    orderId +
    "&orderInfo=" +
    orderInfo +
    "&partnerCode=" +
    partnerCode +
    "&redirectUrl=" +
    redirectUrl +
    "&requestId=" +
    requestId +
    "&requestType=" +
    requestType;

  console.log("--------------------RAW SIGNATURE----------------");
  console.log(rawSignature);

  // Generate signature
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  console.log("--------------------SIGNATURE----------------");
  console.log(signature);

  // JSON object send to MoMo endpoint - exact format from MoMo docs
  const requestBody = JSON.stringify({
    partnerCode: partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: redirectUrl,
    ipnUrl: ipnUrl,
    lang: lang,
    requestType: requestType,
    autoCapture: autoCapture,
    extraData: extraData,
    orderGroupId: orderGroupId,
    signature: signature,
  });

  console.log("--------------------REQUEST BODY----------------");
  console.log(requestBody);

  // Create the HTTPS objects - exact format from MoMo docs
  const options = {
    hostname: "test-payment.momo.vn",
    port: 443,
    path: "/v2/gateway/api/create",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody),
    },
  };

  console.log("Sending to MoMo....");

  // Send the request and get the response - exact format from MoMo docs
  const momoResponse = await new Promise((resolve, reject) => {
    const req = https.request(options, (momoRes) => {
      console.log(`Status: ${momoRes.statusCode}`);
      console.log(`Headers: ${JSON.stringify(momoRes.headers)}`);

      let data = "";
      momoRes.setEncoding("utf8");

      momoRes.on("data", (chunk) => {
        data += chunk;
      });

      momoRes.on("end", () => {
        console.log("Body: ");
        console.log(data);

        try {
          const response = JSON.parse(data);
          console.log("resultCode: ");
          console.log(response.resultCode);
          resolve(response);
        } catch (error) {
          console.error("Error parsing MoMo response:", error);
          reject(new Error("Invalid response from MoMo"));
        }
      });
    });

    req.on("error", (e) => {
      console.log(`problem with request: ${e.message}`);
      reject(e);
    });

    // write data to request body
    req.write(requestBody);
    req.end();
  });

  console.log("No more data in response.");

  // Check MoMo response
  if (momoResponse.resultCode === 0) {
    console.log("MoMo payment created successfully!");
    res.json({
      success: true,
      payUrl: momoResponse.payUrl,
      orderId: momoResponse.orderId,
      requestId: momoResponse.requestId,
    });
  } else {
    console.error("=== MoMo Payment Creation Failed ===");
    console.error("Result Code:", momoResponse.resultCode);
    console.error("Message:", momoResponse.message);
    console.error("Full Response:", momoResponse);
    res.status(400);
    throw new Error(momoResponse.message || "MoMo payment creation failed");
  }
});

// @desc    Handle MoMo IPN (Instant Payment Notification)
// @route   POST /api/payment/momo/ipn
// @access  Public
const handleMomoIPN = asyncHandler(async (req, res) => {
  console.log("=== MoMo IPN Received ===");
  console.log("IPN Body:", req.body);
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature,
  } = req.body;

  // Verify signature - using the same keys as in payment creation
  const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  const accessKey = "F8BBA842ECF85";
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  if (signature !== expectedSignature) {
    res.status(400);
    throw new Error("Invalid signature");
  }

  // Process payment result
  if (resultCode === 0) {
    // Payment successful
    console.log(
      `Payment successful for order ${orderId}, transaction ${transId}`
    );

    try {
      // Update order status in the database
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          isPaid: true,
          paidAt: Date.now(),
          paymentResult: {
            id: transId,
            status: "completed",
            update_time: responseTime,
            email_address: "momo@payment.vn",
          },
        },
        { new: true }
      );

      if (updatedOrder) {
        console.log(`Order ${orderId} marked as paid`);
      } else {
        console.error(`Order ${orderId} not found`);
      }
    } catch (error) {
      console.error(`Error updating order ${orderId}:`, error);
    }

    res.status(200).json({ message: "Payment processed successfully" });
  } else {
    // Payment failed
    console.log(`Payment failed for order ${orderId}: ${message}`);
    res.status(200).json({ message: "Payment failed notification received" });
  }
});

// @desc    Check MoMo payment status
// @route   POST /api/payment/momo/status
// @access  Private
const checkMomoPaymentStatus = asyncHandler(async (req, res) => {
  console.log("=== Checking MoMo Payment Status ===");
  const { orderId } = req.body;
  console.log("Order ID:", orderId);

  if (!orderId) {
    res.status(400);
    throw new Error("Order ID is required");
  }

  const accessKey = "F8BBA842ECF85";
  const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  const partnerCode = "MOMO";
  const requestId = orderId;

  // Create raw signature for status check
  const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = JSON.stringify({
    partnerCode,
    requestId,
    orderId,
    signature,
    lang: "vi",
  });

  const options = {
    hostname: "test-payment.momo.vn",
    port: 443,
    path: "/v2/gateway/api/query",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody),
    },
  };

  const momoResponse = await new Promise((resolve, reject) => {
    const req = https.request(options, (momoRes) => {
      let data = "";

      momoRes.setEncoding("utf8");
      momoRes.on("data", (chunk) => {
        data += chunk;
      });

      momoRes.on("end", () => {
        console.log("MoMo status response:", data);
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error("Invalid response from MoMo"));
        }
      });
    });

    req.on("error", (error) => {
      console.error("Error checking MoMo status:", error);
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });

  console.log("Final MoMo status response:", momoResponse);
  res.json(momoResponse);
});

export { createMomoPayment, handleMomoIPN, checkMomoPaymentStatus };
