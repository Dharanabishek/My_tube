export function generateInvoiceHTML({ invoiceId, planName, amount, date, user, paymentId }) {
  const customerName = user?.name || user?.channelname || user?.email || "Customer";
  const userEmail = user?.email || "";
  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Invoice ${invoiceId}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#f6f9fc; margin:0; padding:20px; }
        .container { max-width:720px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(16,24,40,0.08); }
        .header { background:#2563eb; color:#fff; padding:20px; }
        .header h1 { margin:0; font-size:20px; }
        .content { padding:24px; }
        .invoice-meta { display:flex; justify-content:space-between; gap:12px; margin-bottom:18px; }
        .invoice-table { width:100%; border-collapse:collapse; margin-top:12px; }
        .invoice-table th, .invoice-table td { padding:12px; border-bottom:1px solid #e6edf3; text-align:left; }
        .total { text-align:right; font-size:18px; font-weight:600; margin-top:12px; }
        .footer { padding:16px 24px; font-size:13px; color:#64748b; background:#fbfdff; }
        .badge { display:inline-block; padding:6px 10px; background:#eef2ff; color:#3730a3; border-radius:6px; font-weight:600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>YourTube — Invoice</h1>
        </div>
        <div class="content">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:14px;color:#94a3b8">Billed To</div>
              <div style="font-size:16px;font-weight:600">${customerName}</div>
              <div style="font-size:13px;color:#64748b">${userEmail}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:13px;color:#94a3b8">Invoice</div>
              <div style="font-size:16px;font-weight:700">${invoiceId}</div>
              <div style="font-size:13px;color:#64748b">${date}</div>
            </div>
          </div>

          <div class="invoice-meta">
            <div>
              <div style="font-size:13px;color:#94a3b8">Plan</div>
              <div style="font-size:15px;font-weight:600">${planName}</div>
            </div>
            <div>
              <div style="font-size:13px;color:#94a3b8">Payment ID</div>
              <div style="font-size:13px">${paymentId}</div>
            </div>
          </div>

          <table class="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="width:120px">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${planName} subscription</td>
                <td>₹${amount}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">Total: ₹${amount}</div>
        </div>
        <div class="footer">
          <div style="margin-bottom:8px"><span class="badge">Payment Received</span></div>
          <div>If you have any questions about this invoice, reply to this email or contact support.</div>
          <div style="margin-top:8px;color:#94a3b8">YourTube Pvt Ltd — Registered Office</div>
        </div>
      </div>
    </body>
  </html>
  `;
}
