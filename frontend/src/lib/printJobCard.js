export function printJobCard(job) {
  const fmt = v => v || '—';
  const fmtDate = str => str
    ? new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const fmtMoney = v => v != null && v !== '' ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

  const row = (label, value) =>
    `<tr><td class="label">${label}</td><td class="value">${fmt(value)}</td></tr>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Job Card ${job.job_card_id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 28px 32px;
      max-width: 720px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f97316;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand { font-size: 26px; font-weight: 800; color: #f97316; letter-spacing: -0.5px; }
    .tagline { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
    .job-id-block { text-align: right; }
    .job-id { font-size: 20px; font-weight: 700; color: #111; }
    .job-date { font-size: 11px; color: #666; margin-top: 3px; }

    /* ── Status badge ── */
    .status-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    /* ── Sections ── */
    .sections { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .section { border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; }
    .section-full { grid-column: span 2; }
    .section-head {
      background: #f8f8f8;
      border-bottom: 1px solid #e5e5e5;
      padding: 7px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #555;
    }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 12px; vertical-align: top; }
    td.label {
      width: 42%;
      color: #666;
      font-size: 12px;
    }
    td.value {
      font-weight: 500;
      color: #111;
    }
    tr + tr td { border-top: 1px solid #f0f0f0; }

    /* ── Financials ── */
    .financials {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 16px;
    }
    .fin-cell {
      padding: 12px 16px;
      border-right: 1px solid #e5e5e5;
      text-align: center;
    }
    .fin-cell:last-child { border-right: none; }
    .fin-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .fin-value { font-size: 18px; font-weight: 700; color: #111; }
    .fin-value.pending { color: #f97316; }

    /* ── Remarks ── */
    .remarks-box {
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 16px;
      min-height: 50px;
      color: #444;
      font-size: 12.5px;
      line-height: 1.5;
    }
    .remarks-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #555;
      margin-bottom: 5px;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px dashed #ddd;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11px;
      color: #999;
    }
    .sig-line {
      border-top: 1px solid #ccc;
      width: 160px;
      text-align: center;
      padding-top: 4px;
      font-size: 11px;
      color: #888;
    }

    @media print {
      body { padding: 16px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand">Fixora</div>
      <div class="tagline">Mobile Repair Management</div>
    </div>
    <div class="job-id-block">
      <div class="job-id">${job.job_card_id}</div>
      <div class="job-date">Created: ${fmtDate(job.created_at)}</div>
      ${job.eta ? `<div class="job-date">ETA: ${fmtDate(job.eta)}</div>` : ''}
    </div>
  </div>

  <!-- Status -->
  <div class="status-row">
    <span>Status:</span>
    <span class="status-badge" style="${statusStyle(job.status)}">${job.status}</span>
    ${job.technician ? `<span style="color:#666; font-size:12px;">Technician: <strong>${job.technician}</strong></span>` : ''}
    ${job.prepared_by ? `<span style="color:#999; font-size:11px; margin-left:auto;">Prepared by: ${job.prepared_by}</span>` : ''}
  </div>

  <!-- Main sections -->
  <div class="sections">

    <!-- Customer Info -->
    <div class="section">
      <div class="section-head">Customer Information</div>
      <table>
        ${row('Name', (job.salutation ? job.salutation + ' ' : '') + job.customer_name)}
        ${row('Phone', job.customer_phone)}
        ${job.alt_mobile_no ? row('Alt. Phone', job.alt_mobile_no) : ''}
        ${job.address ? row('Address', job.address) : ''}
      </table>
    </div>

    <!-- Device Info -->
    <div class="section">
      <div class="section-head">Device Information</div>
      <table>
        ${row('Brand / Model', `${job.phone_brand} ${job.phone_model}`)}
        ${job.color ? row('Color', job.color) : ''}
        ${job.imei_status ? row('IMEI Status', job.imei_status) : ''}
        ${job.device_condition ? row('Condition', job.device_condition) : ''}
        ${job.pattern_password ? row('Password / Pattern', job.pattern_password) : ''}
      </table>
    </div>

    <!-- Device Checklist -->
    <div class="section">
      <div class="section-head">Device Checklist</div>
      <table>
        ${job.power_status   ? row('Power',   job.power_status)   : ''}
        ${job.touch_status   ? row('Touch',   job.touch_status)   : ''}
        ${job.display_status ? row('Display', job.display_status) : ''}
        ${job.data_backup    ? row('Data Backup', job.data_backup) : ''}
      </table>
    </div>

    <!-- Reported Issue -->
    <div class="section">
      <div class="section-head">Reported Issue</div>
      <table>
        <tr><td colspan="2" style="padding: 10px 12px; line-height: 1.6;">${fmt(job.reported_issue)}</td></tr>
      </table>
    </div>

  </div>

  <!-- Financials -->
  <div class="financials">
    <div class="fin-cell">
      <div class="fin-label">Estimated Amount</div>
      <div class="fin-value">${fmtMoney(job.estimated_amount)}</div>
    </div>
    <div class="fin-cell">
      <div class="fin-label">Advance Collected</div>
      <div class="fin-value">${fmtMoney(job.advance_amount)}</div>
    </div>
    <div class="fin-cell">
      <div class="fin-label">Balance Due</div>
      <div class="fin-value pending">${
        job.estimated_amount != null && job.advance_amount != null
          ? fmtMoney(Number(job.estimated_amount) - Number(job.advance_amount))
          : '—'
      }</div>
    </div>
  </div>

  <!-- Remarks -->
  ${job.remarks ? `
  <div style="margin-top: 16px;">
    <div class="remarks-label">Remarks / Notes</div>
    <div class="remarks-box">${job.remarks}</div>
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <div>
      <div>Thank you for choosing Fixora.</div>
      <div style="margin-top:3px;">Please carry this slip when collecting your device.</div>
    </div>
    <div class="sig-line">Customer Signature</div>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  win.document.write(html);
  win.document.close();
}

function statusStyle(status) {
  const styles = {
    'Pending':            'background:#fef9c3; color:#a16207;',
    'In Progress':        'background:#dbeafe; color:#1d4ed8;',
    'Ready for Delivery': 'background:#dcfce7; color:#15803d;',
    'Delivered':          'background:#ede9fe; color:#6d28d9;',
    'Returned':           'background:#fee2e2; color:#b91c1c;',
    'Delayed':            'background:#ffedd5; color:#c2410c;',
    'Cancelled':          'background:#f3f4f6; color:#6b7280;',
  };
  return styles[status] || 'background:#f3f4f6; color:#333;';
}
