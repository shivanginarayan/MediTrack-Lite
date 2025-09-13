import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seed...');

  // Create demo clinic
  const demoClinic = await prisma.clinic.upsert({
    where: { id: 'demo-clinic-1' },
    update: {},
    create: {
      id: 'demo-clinic-1',
      name: 'MediTrack Demo Clinic',
      address: '123 Healthcare Ave, Medical City, MC 12345',
      phone: '+1 (555) 123-4567',
      email: 'admin@meditrack-demo.com',
      timezone: 'America/New_York',
      settings: JSON.stringify({
        language: 'en',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
        currency: 'USD',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
        inventory: {
          lowStockThreshold: 10,
          expiryWarningDays: 30,
          autoReorderEnabled: false,
        },
        alerts: {
          enableLowStock: true,
          enableExpiry: true,
          enableCustom: true,
        },
      }),
    },
  });

  logger.info('Demo clinic created', { clinicId: demoClinic.id });

  // Create demo users
  const hashedPassword = await bcrypt.hash('demo123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@meditrack-demo.com' },
    update: {},
    create: {
      email: 'admin@meditrack-demo.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      clinicId: demoClinic.id,
      isActive: true,
    },
  });

  const leadUser = await prisma.user.upsert({
    where: { email: 'lead@meditrack-demo.com' },
    update: {},
    create: {
      email: 'lead@meditrack-demo.com',
      name: 'Lead Pharmacist',
      password: hashedPassword,
      role: 'LEAD',
      clinicId: demoClinic.id,
      isActive: true,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@meditrack-demo.com' },
    update: {},
    create: {
      email: 'staff@meditrack-demo.com',
      name: 'Staff Member',
      password: hashedPassword,
      role: 'STAFF',
      clinicId: demoClinic.id,
      isActive: true,
    },
  });

  logger.info('Demo users created', {
    adminId: adminUser.id,
    leadId: leadUser.id,
    staffId: staffUser.id,
  });

  // Create demo inventory items
  const items = [
    {
      name: 'Acetaminophen 500mg',
      description: 'Pain reliever and fever reducer',
      category: 'Pain Management',
      unit: 'tablets',
      threshold: 50,
      price: 0.25,
    },
    {
      name: 'Amoxicillin 250mg',
      description: 'Antibiotic for bacterial infections',
      category: 'Antibiotics',
      unit: 'capsules',
      threshold: 30,
      price: 0.75,
    },
    {
      name: 'Lisinopril 10mg',
      description: 'ACE inhibitor for blood pressure',
      category: 'Cardiovascular',
      unit: 'tablets',
      threshold: 25,
      price: 0.50,
    },
    {
      name: 'Metformin 500mg',
      description: 'Diabetes medication',
      category: 'Diabetes',
      unit: 'tablets',
      threshold: 40,
      price: 0.30,
    },
    {
      name: 'Ibuprofen 200mg',
      description: 'Anti-inflammatory pain reliever',
      category: 'Pain Management',
      unit: 'tablets',
      threshold: 60,
      price: 0.20,
    },
  ];

  const createdItems = [];
  for (const itemData of items) {
    const item = await prisma.item.create({
      data: {
        ...itemData,
        clinicId: demoClinic.id,
        isActive: true,
      },
    });
    createdItems.push(item);
  }

  logger.info('Demo items created', { count: createdItems.length });

  // Create demo batches for items
  const batches = [
    {
      itemId: createdItems[0].id,
      batchNumber: 'BATCH-ACE001',
      lotNumber: 'ACE001',
      quantity: 100,
      expiryDate: new Date('2025-12-31'),
    },
    {
      itemId: createdItems[0].id,
      batchNumber: 'BATCH-ACE002',
      lotNumber: 'ACE002',
      quantity: 25, // Low stock
      expiryDate: new Date('2024-06-30'), // Expiring soon
    },
    {
      itemId: createdItems[1].id,
      batchNumber: 'BATCH-AMX001',
      lotNumber: 'AMX001',
      quantity: 75,
      expiryDate: new Date('2025-08-15'),
    },
    {
      itemId: createdItems[2].id,
      batchNumber: 'BATCH-LIS001',
      lotNumber: 'LIS001',
      quantity: 15, // Low stock
      expiryDate: new Date('2025-10-20'),
    },
    {
      itemId: createdItems[3].id,
      batchNumber: 'BATCH-MET001',
      lotNumber: 'MET001',
      quantity: 80,
      expiryDate: new Date('2025-09-10'),
    },
    {
      itemId: createdItems[4].id,
      batchNumber: 'BATCH-IBU001',
      lotNumber: 'IBU001',
      quantity: 120,
      expiryDate: new Date('2025-11-30'),
    },
  ];

  const createdBatches = [];
  for (const batchData of batches) {
    const batch = await prisma.batch.create({
      data: batchData,
    });
    createdBatches.push(batch);
  }

  logger.info('Demo batches created', { count: createdBatches.length });

  // Create demo stock adjustments
  const adjustments = [
    {
      itemId: createdItems[0].id,
      type: 'DISPENSED',
      quantity: -10,
      reason: 'Patient prescription',
      notes: 'Dispensed to patient John Doe',
      userId: staffUser.id,
    },
    {
      itemId: createdItems[1].id,
      type: 'RECEIVED',
      quantity: 50,
      reason: 'New shipment',
      notes: 'Received from supplier MediSupply',
      userId: leadUser.id,
    },
    {
      itemId: createdItems[2].id,
      type: 'DISPENSED',
      quantity: -5,
      reason: 'Patient prescription',
      notes: 'Dispensed to patient Jane Smith',
      userId: staffUser.id,
    },
  ];

  for (const adjustmentData of adjustments) {
    await prisma.stockAdjustment.create({
      data: adjustmentData,
    });
  }

  logger.info('Demo stock adjustments created', { count: adjustments.length });

  // Create demo alert rules
  const alertRules = [
    {
      name: 'Low Stock Alert',
      type: 'LOW_STOCK',
      threshold: 20,
      recipients: JSON.stringify(['admin@meditrack-demo.com', 'lead@meditrack-demo.com']),
      channels: JSON.stringify(['EMAIL']),
      isActive: true,
      clinicId: demoClinic.id,
      userId: adminUser.id,
    },
    {
      name: 'Expiry Warning',
      type: 'EXPIRING_SOON',
      threshold: 30, // 30 days
      recipients: JSON.stringify(['lead@meditrack-demo.com']),
      channels: JSON.stringify(['EMAIL']),
      isActive: true,
      clinicId: demoClinic.id,
      userId: adminUser.id,
    },
    {
      name: 'Acetaminophen Low Stock',
      type: 'LOW_STOCK',
      threshold: 30,
      recipients: JSON.stringify(['admin@meditrack-demo.com']),
      channels: JSON.stringify(['EMAIL']),
      isActive: true,
      itemId: createdItems[0].id,
      clinicId: demoClinic.id,
      userId: leadUser.id,
    },
  ];

  const createdRules = [];
  for (const ruleData of alertRules) {
    const rule = await prisma.alertRule.create({
      data: ruleData,
    });
    createdRules.push(rule);
  }

  logger.info('Demo alert rules created', { count: createdRules.length });

  // Create demo alerts
  const alerts = [
    {
      type: 'LOW_STOCK',
      title: 'Low Stock: Lisinopril 10mg',
      message: 'Lisinopril 10mg is running low (15 units remaining). Consider reordering.',
      severity: 'HIGH',
      data: JSON.stringify({
        itemId: createdItems[2].id,
        currentStock: 15,
        threshold: 25,
      }),
      ruleId: createdRules[0].id,
      isRead: false,
      isResolved: false,
    },
    {
      type: 'EXPIRING_SOON',
      title: 'Expiring Soon: Acetaminophen 500mg',
      message: 'Batch ACE002 of Acetaminophen 500mg expires on 2024-06-30.',
      severity: 'MEDIUM',
      data: JSON.stringify({
        itemId: createdItems[0].id,
        batchId: createdBatches[1].id,
        expiryDate: '2024-06-30',
        daysUntilExpiry: Math.ceil((new Date('2024-06-30').getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      }),
      ruleId: createdRules[1].id,
      isRead: true,
      isResolved: false,
    },
  ];

  for (const alertData of alerts) {
    await prisma.alert.create({
      data: alertData,
    });
  }

  logger.info('Demo alerts created', { count: alerts.length });

  // Create demo message templates
  const templates = [
    {
      name: 'Low Stock Notification',
      type: 'ALERT',
      subject: 'Low Stock Alert: {{itemName}}',
      content: 'Dear team,\n\nThis is to notify you that {{itemName}} is running low.\n\nCurrent stock: {{currentStock}} {{unit}}\nThreshold: {{threshold}} {{unit}}\n\nPlease consider reordering.\n\nBest regards,\nMediTrack System',
      language: 'en',
      variables: JSON.stringify(['itemName', 'currentStock', 'unit', 'threshold']),
      isActive: true,
      clinicId: demoClinic.id,
      userId: adminUser.id,
    },
    {
      name: 'Expiry Warning',
      type: 'ALERT',
      subject: 'Expiry Warning: {{itemName}}',
      content: 'Dear team,\n\nThis is to notify you that {{itemName}} (Batch: {{lotNumber}}) will expire on {{expiryDate}}.\n\nDays until expiry: {{daysUntilExpiry}}\n\nPlease prioritize dispensing this batch.\n\nBest regards,\nMediTrack System',
      language: 'en',
      variables: JSON.stringify(['itemName', 'lotNumber', 'expiryDate', 'daysUntilExpiry']),
      isActive: true,
      clinicId: demoClinic.id,
      userId: adminUser.id,
    },
    {
      name: 'Weekly Inventory Report',
      type: 'BROADCAST',
      subject: 'Weekly Inventory Report - {{weekOf}}',
      content: 'Dear team,\n\nHere is your weekly inventory summary:\n\n- Total items: {{totalItems}}\n- Low stock items: {{lowStockCount}}\n- Expiring items: {{expiringCount}}\n- Recent adjustments: {{adjustmentCount}}\n\nPlease review and take necessary actions.\n\nBest regards,\nMediTrack System',
      language: 'en',
      variables: JSON.stringify(['weekOf', 'totalItems', 'lowStockCount', 'expiringCount', 'adjustmentCount']),
      isActive: true,
      clinicId: demoClinic.id,
      userId: leadUser.id,
    },
  ];

  const createdTemplates = [];
  for (const templateData of templates) {
    const template = await prisma.messageTemplate.create({
      data: templateData,
    });
    createdTemplates.push(template);
  }

  logger.info('Demo message templates created', { count: createdTemplates.length });

  // Create demo messages
  const messages = [
    {
      type: 'BROADCAST',
      subject: 'Welcome to MediTrack Lite',
      content: 'Welcome to MediTrack Lite! This is a demo message to show how the messaging system works.',
      language: 'en',
      recipients: JSON.stringify(['admin@meditrack-demo.com', 'lead@meditrack-demo.com', 'staff@meditrack-demo.com']),
      channels: JSON.stringify(['EMAIL']),
      status: 'SENT',
      sentAt: new Date(),
      templateId: null,
      metadata: JSON.stringify({
        isWelcomeMessage: true,
      }),
      clinicId: demoClinic.id,
      userId: adminUser.id,
    },
    {
      type: 'ALERT',
      subject: 'Low Stock Alert: Lisinopril 10mg',
      content: 'This is an automated alert about low stock levels for Lisinopril 10mg.',
      language: 'en',
      recipients: JSON.stringify(['admin@meditrack-demo.com', 'lead@meditrack-demo.com']),
      channels: JSON.stringify(['EMAIL']),
      status: 'QUEUED',
      templateId: createdTemplates[0].id,
      metadata: JSON.stringify({
        alertId: 'alert-123',
        itemId: createdItems[2].id,
      }),
      clinicId: demoClinic.id,
      userId: adminUser.id,
    },
  ];

  for (const messageData of messages) {
    await prisma.message.create({
      data: messageData,
    });
  }

  logger.info('Demo messages created', { count: messages.length });

  logger.info('Database seed completed successfully!');
  
  // Print summary
  console.log('\n=== DEMO DATA SUMMARY ===');
  console.log(`Clinic: ${demoClinic.name}`);
  console.log(`Users: 3 (Admin, Lead, Staff)`);
  console.log(`Items: ${createdItems.length}`);
  console.log(`Batches: ${createdBatches.length}`);
  console.log(`Alert Rules: ${createdRules.length}`);
  console.log(`Alerts: ${alerts.length}`);
  console.log(`Message Templates: ${createdTemplates.length}`);
  console.log(`Messages: ${messages.length}`);
  console.log('\n=== LOGIN CREDENTIALS ===');
  console.log('Admin: admin@meditrack-demo.com / demo123');
  console.log('Lead: lead@meditrack-demo.com / demo123');
  console.log('Staff: staff@meditrack-demo.com / demo123');
  console.log('========================\n');
}

main()
  .catch((e) => {
    logger.error('Seed failed', { error: e.message, stack: e.stack });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });