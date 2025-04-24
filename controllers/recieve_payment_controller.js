const axios = require('axios');
require('dotenv').config();

const generateTxRef = () => {
    const prefix = 'chopnowng'; // Replace with your desired prefix
    const timestamp = Date.now(); // Current timestamp in milliseconds
    const randomString = Math.random().toString(36).substring(2, 8); // Generate a random string
  
    return `${prefix}-${timestamp}-${randomString}`;
};

async function recievePyment (req, res) {
  console.log("Starting...")
    const { amount, email, currency } = req.body;

  try {
    const tx_ref = generateTxRef(); // Generate a unique transaction reference

    const response = await axios.post('https://api.flutterwave.com/v3/payments', {
      tx_ref,
      amount,
      currency,
      redirect_url: "https://https://nobsafrica.webflow.io",
      payment_type: "card",
      customer: {
        email,
      },
      customizations: {
        title: "Payment for services",
        description: "Payment for services rendered",
      }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
      }
    });

    res.status(200).send(response.data);
    console.log("end...")
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("end...")
  }
} 

async function payment_callback (req, res) {

  if (req.query.status === 'successful') {
      const transactionDetails = await Transaction.find({ref: req.query.tx_ref});
      const response = await flw.Transaction.verify({id: req.query.transaction_id});
      if (
          response.data.status === "successful"
          && response.data.amount === transactionDetails.amount
          && response.data.currency === "NGN") {
          // Success! Confirm the customer's payment
      } else {
          // Inform the customer their payment was unsuccessful
      }
  }
}



async function webhooks(req, res) {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature = req.headers['verif-hash'];

  // if (!signature || signature !== secretHash) {
  //   return res.status(401).send('Unauthorized');
  // }

  // const event = req.body;
  // console.log('Webhook event received:', event);
  // console.log('Raw Webhook Event:', JSON.stringify(event, null, 2));

  // if (event['event.type'] === 'CARD_TRANSACTION' && event.status === 'successful') {
  //   console.log('Payment successful, triggering payout...');

  //   // 20% of the delivery amount goes to the logistics company
  //   const payoutAmount = event.amount * 0.20;
  //   await initiatePayout(payoutAmount, `Delivery for Transaction Ref: ${event.tx_ref}`);
  // } else {
  //   console.log('Payment failed or incomplete:', event);
  // }

  res.status(200).send('Webhook received successfully');
}



async function initiatePayout(req, res) {
  const { account_bank, account_number, amount, narration, full_name } = req.body;
  console.log("calling the payout function...");
  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/transfers",
      {
        account_bank: account_bank,
        account_number: account_number,
        amount: amount,
        narration: narration || "Payout for delivery",
        currency: "NGN",
        reference: generateTxRef(),
        debit_currency: "NGN",
        full_name: full_name
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    res.status(200).json({
      message: "transaction completed",
      response: response.data, // ✅ This is the part you want to return
    });
  } catch (error) {
    console.error("Payout error:", error?.response?.data || error.message);
    res.status(500).json({
      message: "transaction not completed",
      response: error?.response?.data || error.message,
    });
  }
}





module.exports = {recievePyment, payment_callback, webhooks, initiatePayout}
