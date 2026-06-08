const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const BASE = "https://api.paystack.co";

async function paystackRequest(path: string, method = "GET", body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo/lowest unit
  reference: string;
  callbackUrl: string;
  metadata?: object;
}) {
  return paystackRequest("/transaction/initialize", "POST", {
    email: params.email,
    amount: params.amount,
    reference: params.reference,
    callback_url: params.callbackUrl,
    metadata: params.metadata,
  });
}

export async function verifyTransaction(reference: string) {
  return paystackRequest(`/transaction/verify/${reference}`);
}

export async function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
}) {
  return paystackRequest("/transferrecipient", "POST", {
    type: "nuban",
    name: params.name,
    account_number: params.accountNumber,
    bank_code: params.bankCode,
    currency: "NGN",
  });
}

export async function initiateTransfer(params: {
  amount: number;
  recipientCode: string;
  reason: string;
  reference: string;
}) {
  return paystackRequest("/transfer", "POST", {
    source: "balance",
    amount: params.amount,
    recipient: params.recipientCode,
    reason: params.reason,
    reference: params.reference,
  });
}

export async function listBanks() {
  return paystackRequest("/bank?currency=NGN&perPage=100");
}

export function generateReference(prefix = "OJ") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
