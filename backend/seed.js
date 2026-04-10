/**
 * Fixora — Sample Data Seed Script
 * Run: node seed.js
 * Creates 10 job cards across all 6 statuses with realistic data.
 *
 * NOTE: Update TECHNICIANS and PREPARED_BY below to match your actual user names.
 */

require('dotenv').config();
const supabase = require('./lib/supabase');

// ── Configure to match your user accounts ──────────────────
const TECHNICIANS  = ['Technician', 'Technician'];
const PREPARED_BY  = 'Admin';
// ───────────────────────────────────────────────────────────

const now   = new Date();
const daysAgo  = d => new Date(now - d * 86400000).toISOString();
const daysAhead = d => new Date(now.getTime() + d * 86400000).toISOString().slice(0, 10);

const CARDS = [
  // ── Pending ────────────────────────────────────────────
  {
    salutation:       'Mr.',
    customer_name:    'Arjun Mehta',
    customer_phone:   '+91 9876543210',
    alt_mobile_no:    '+91 9123456789',
    address:          '12, Nehru Street, Chennai - 600001',
    phone_brand:      'Samsung',
    phone_model:      'Galaxy S23',
    color:            'Phantom Black',
    pattern_password: '1234',
    imei_status:      'Matches',
    power_status:     'Powers On',
    touch_status:     'Working',
    display_status:   'Cracked',
    device_condition: 'Good',
    reported_issue:   'Front display glass cracked after drop. Touch still works but glass needs replacement.',
    data_backup:      'Not Required',
    estimated_amount: 4500,
    advance_amount:   1000,
    confirm_estimated: true,
    technician:       TECHNICIANS[0],
    prepared_by:      PREPARED_BY,
    eta:              daysAhead(2),
    status:           'Pending',
    created_at:       daysAgo(1),
  },

  // ── Pending ────────────────────────────────────────────
  {
    salutation:       'Ms.',
    customer_name:    'Priya Sharma',
    customer_phone:   '+91 9988776655',
    address:          '45, Anna Nagar, Chennai - 600040',
    phone_brand:      'Apple',
    phone_model:      'iPhone 14',
    color:            'Midnight',
    imei_status:      'Matches',
    power_status:     'Powers On',
    touch_status:     'Working',
    display_status:   'Working',
    device_condition: 'Good',
    reported_issue:   'Battery draining very fast. Phone barely lasts 3 hours on single charge.',
    data_backup:      'Done',
    estimated_amount: 3200,
    advance_amount:   500,
    confirm_estimated: true,
    technician:       TECHNICIANS[1],
    prepared_by:      PREPARED_BY,
    eta:              daysAhead(1),
    status:           'Pending',
    created_at:       daysAgo(0.5),
  },

  // ── In Progress ────────────────────────────────────────
  {
    salutation:       'Mr.',
    customer_name:    'Karthik Rajan',
    customer_phone:   '+91 9876512340',
    address:          '8, T Nagar, Chennai - 600017',
    phone_brand:      'OnePlus',
    phone_model:      '11 5G',
    color:            'Titan Black',
    pattern_password: 'None',
    imei_status:      'Matches',
    power_status:     'Powers On',
    touch_status:     'Working',
    display_status:   'Working',
    device_condition: 'Fair',
    reported_issue:   'Charging port not working. Phone does not charge with any cable. Tried wireless charging — works fine.',
    data_backup:      'Not Required',
    estimated_amount: 1800,
    advance_amount:   500,
    confirm_estimated: true,
    technician:       TECHNICIANS[0],
    prepared_by:      PREPARED_BY,
    eta:              daysAhead(1),
    status:           'In Progress',
    created_at:       daysAgo(2),
  },

  // ── In Progress ────────────────────────────────────────
  {
    salutation:       'Mrs.',
    customer_name:    'Deepa Nair',
    customer_phone:   '+91 9445566778',
    address:          '22, Velachery Main Road, Chennai - 600042',
    phone_brand:      'Apple',
    phone_model:      'iPhone 12 Mini',
    color:            'Blue',
    imei_status:      'Matches',
    power_status:     'Powers On',
    touch_status:     'Working',
    display_status:   'Working',
    device_condition: 'Good',
    reported_issue:   'Face ID stopped working after screen replacement done elsewhere. Shows "Face ID not available" error.',
    data_backup:      'Done',
    estimated_amount: 5500,
    advance_amount:   2000,
    confirm_estimated: false,
    technician:       TECHNICIANS[1],
    prepared_by:      PREPARED_BY,
    eta:              daysAhead(3),
    remarks:          'Waiting for Face ID flex cable to arrive. Customer informed.',
    status:           'In Progress',
    created_at:       daysAgo(3),
  },

  // ── Ready for Delivery ─────────────────────────────────
  {
    salutation:       'Mr.',
    customer_name:    'Suresh Babu',
    customer_phone:   '+91 9600123456',
    address:          '3, Gandhi Road, Coimbatore - 641001',
    phone_brand:      'Xiaomi',
    phone_model:      'Redmi Note 12 Pro',
    color:            'Sky Blue',
    imei_status:      'Matches',
    power_status:     'Powers On',
    touch_status:     'Working',
    display_status:   'Replaced',
    device_condition: 'Good',
    reported_issue:   'Display completely black after drop. Touch not responding.',
    data_backup:      'Done',
    estimated_amount: 3800,
    advance_amount:   2000,
    confirm_estimated: true,
    technician:       TECHNICIANS[0],
    prepared_by:      PREPARED_BY,
    eta:              daysAhead(0),
    remarks:          'New AMOLED display fitted. Tested — all working fine. Customer called, coming to collect.',
    status:           'Ready for Delivery',
    created_at:       daysAgo(4),
  },

  // ── Ready for Delivery ─────────────────────────────────
  {
    salutation:       'Mr.',
    customer_name:    'Vikram Anand',
    customer_phone:   '+91 9787654321',
    address:          '67, MG Road, Bengaluru - 560001',
    phone_brand:      'Apple',
    phone_model:      'iPhone 13 Pro',
    color:            'Sierra Blue',
    imei_status:      'Matches',
    power_status:     'Powers On',
    touch_status:     'Working',
    display_status:   'Working',
    device_condition: 'Fair',
    reported_issue:   'Water damage — phone fell in swimming pool. Speaker and mic not working.',
    data_backup:      'Done',
    estimated_amount: 8500,
    advance_amount:   4000,
    confirm_estimated: true,
    technician:       TECHNICIANS[1],
    prepared_by:      PREPARED_BY,
    remarks:          'Cleaned PCB, replaced speaker and mic module. Full function test done. Ready.',
    status:           'Ready for Delivery',
    created_at:       daysAgo(5),
  },

  // ── Delivered ──────────────────────────────────────────
  {
    salutation:       'Mr.',
    customer_name:    'Arun Krishnan',
    customer_phone:   '+91 9345678901',
    address:          '15, Besant Nagar, Chennai - 600090',
    phone_brand:      'Realme',
    phone_model:      'GT 2 Pro',
    color:            'Steel Black',
    imei_status:      'Matches',
    power_status:     'Powers On',
    touch_status:     'Working',
    display_status:   'Working',
    device_condition: 'Good',
    reported_issue:   'Phone not turning on. Completely dead. No response to charging.',
    data_backup:      'Not Required',
    estimated_amount: 6500,
    advance_amount:   6500,
    confirm_estimated: true,
    technician:       TECHNICIANS[0],
    prepared_by:      PREPARED_BY,
    remarks:          'Motherboard power IC replaced. Phone working perfectly. Full payment received.',
    status:           'Delivered',
    created_at:       daysAgo(10),
    delivered_at:     daysAgo(2),
  },

  // ── Delivered ──────────────────────────────────────────
  {
    salutation:       'Ms.',
    customer_name:    'Kavitha Sundaram',
    customer_phone:   '+91 9566778899',
    address:          '28, Adyar, Chennai - 600020',
    phone_brand:      'Samsung',
    phone_model:      'Galaxy A54',
    color:            'Awesome White',
    imei_status:      'Matches',
    power_status:     'Powers On',
    touch_status:     'Partial',
    display_status:   'Cracked',
    device_condition: 'Fair',
    reported_issue:   'Screen cracked and touch not working on top half after drop.',
    data_backup:      'Done',
    estimated_amount: 3200,
    advance_amount:   3200,
    confirm_estimated: true,
    technician:       TECHNICIANS[1],
    prepared_by:      PREPARED_BY,
    remarks:          'Display assembly replaced. Full touch and display working. Customer happy.',
    status:           'Delivered',
    created_at:       daysAgo(8),
    delivered_at:     daysAgo(1),
  },

  // ── Delayed ────────────────────────────────────────────
  {
    salutation:       'Mr.',
    customer_name:    'Mohan Das',
    customer_phone:   '+91 9123344556',
    address:          '9, Porur, Chennai - 600116',
    phone_brand:      'Vivo',
    phone_model:      'V29 Pro',
    color:            'Himalayan Blue',
    imei_status:      'Matches',
    power_status:     'Powers On',
    touch_status:     'Not Working',
    display_status:   'Cracked',
    device_condition: 'Poor',
    reported_issue:   'Screen shattered completely. Touch unresponsive throughout.',
    data_backup:      'Not Possible',
    estimated_amount: 5200,
    advance_amount:   1000,
    confirm_estimated: false,
    technician:       TECHNICIANS[0],
    prepared_by:      PREPARED_BY,
    eta:              daysAhead(5),
    remarks:          'Original display part not available locally. Ordered from Delhi distributor. ETA 5 days.',
    status:           'Delayed',
    created_at:       daysAgo(6),
  },

  // ── Returned ───────────────────────────────────────────
  {
    salutation:       'Mr.',
    customer_name:    'Rajesh Pillai',
    customer_phone:   '+91 9900112233',
    address:          '5, Tambaram, Chennai - 600045',
    phone_brand:      'Apple',
    phone_model:      'iPhone X',
    color:            'Space Gray',
    imei_status:      'Matches',
    power_status:     'Does Not Power On',
    touch_status:     'Not Working',
    display_status:   'Not Working',
    device_condition: 'Poor',
    reported_issue:   'Phone got wet. Completely dead. Multiple repair attempts done elsewhere before bringing here.',
    data_backup:      'Not Possible',
    estimated_amount: 0,
    advance_amount:   0,
    confirm_estimated: false,
    technician:       TECHNICIANS[1],
    prepared_by:      PREPARED_BY,
    remarks:          'Severe corrosion on motherboard. Multiple components dead. Repair not economically viable. Returned to customer with explanation.',
    status:           'Returned',
    created_at:       daysAgo(7),
  },
];

async function seed() {
  console.log('🌱  Fixora seed — inserting sample job cards...\n');

  let successCount = 0;

  for (const card of CARDS) {
    // Get next job card ID
    const { data: idData, error: idErr } = await supabase.rpc('next_job_card_id');
    if (idErr) {
      console.error('  ✗  Failed to generate ID:', idErr.message);
      continue;
    }

    const jobCardId = idData;
    const { created_at, delivered_at, ...rest } = card;

    const insertData = {
      job_card_id: jobCardId,
      ...rest,
    };

    // Supabase doesn't allow setting created_at directly on insert via JS
    // so we insert first, then update timestamps via raw SQL approach
    const { data, error } = await supabase
      .from('job_cards')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(`  ✗  ${card.customer_name} (${card.phone_brand} ${card.phone_model}):`, error.message);
      continue;
    }

    // Backdate created_at and delivered_at using update
    const timeUpdate = { created_at };
    if (delivered_at) timeUpdate.delivered_at = delivered_at;

    await supabase
      .from('job_cards')
      .update(timeUpdate)
      .eq('job_card_id', jobCardId);

    // Insert initial status log
    await supabase.from('job_card_status_log').insert({
      job_card_id: jobCardId,
      old_status:  null,
      new_status:  'Pending',
      notes:       'Job card created',
      changed_at:  created_at,
    });

    // For non-Pending cards, add a status transition log entry
    if (card.status !== 'Pending') {
      await supabase.from('job_card_status_log').insert({
        job_card_id: jobCardId,
        old_status:  'Pending',
        new_status:  card.status,
        changed_at:  delivered_at || daysAgo(1),
      });
    }

    console.log(`  ✓  ${jobCardId}  ${card.status.padEnd(20)}  ${card.customer_name} — ${card.phone_brand} ${card.phone_model}`);
    successCount++;
  }

  console.log(`\n✅  Done — ${successCount}/${CARDS.length} job cards created.\n`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
