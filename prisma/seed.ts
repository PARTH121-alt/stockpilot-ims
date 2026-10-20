import { PrismaClient, MovementType, ApprovalType, NotificationType, PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Organization ──────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: "urbanmart" },
    update: {},
    create: {
      name: "UrbanMart Retail Group",
      slug: "urbanmart",
      currency: "INR",
      timezone: "Asia/Kolkata",
      locale: "en-IN",
      taxRate: 18,
      address: "Ghaziabad, Uttar Pradesh, India",
      phone: "+91-9876543210",
      email: "info@urbanmart.demo",
      isDemo: true,
    },
  });
  console.log(`✓ Organization: ${org.name}`);

  // ─── Branches ──────────────────────────────────────────────────────────
  const branch1 = await prisma.branch.upsert({
    where: { orgId_code: { orgId: org.id, code: "GZB" } },
    update: {},
    create: {
      orgId: org.id,
      name: "Ghaziabad Central",
      code: "GZB",
      address: "Shop 12, City Centre, Ghaziabad, UP 201001",
      phone: "+91-9876543211",
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { orgId_code: { orgId: org.id, code: "Noida" } },
    update: {},
    create: {
      orgId: org.id,
      name: "Noida Sector 18",
      code: "Noida",
      address: "B-45, Sector 18, Noida, UP 201301",
      phone: "+91-9876543212",
    },
  });

  const branch3 = await prisma.branch.upsert({
    where: { orgId_code: { orgId: org.id, code: "Indirapuram" } },
    update: {},
    create: {
      orgId: org.id,
      name: "Indirapuram",
      code: "Indirapuram",
      address: "C-7, Indirapuram, Ghaziabad, UP 201014",
      phone: "+91-9876543213",
    },
  });
  console.log(`✓ Branches: ${branch1.name}, ${branch2.name}, ${branch3.name}`);

  // ─── Warehouses ────────────────────────────────────────────────────────
  const wh1 = await prisma.warehouse.upsert({
    where: { orgId_code: { orgId: org.id, code: "GZB-MAIN" } },
    update: {},
    create: {
      orgId: org.id,
      branchId: branch1.id,
      name: "Ghaziabad Main Warehouse",
      code: "GZB-MAIN",
    },
  });

  const wh2 = await prisma.warehouse.upsert({
    where: { orgId_code: { orgId: org.id, code: "NOIDA-MAIN" } },
    update: {},
    create: {
      orgId: org.id,
      branchId: branch2.id,
      name: "Noida Main Warehouse",
      code: "NOIDA-MAIN",
    },
  });

  const wh3 = await prisma.warehouse.upsert({
    where: { orgId_code: { orgId: org.id, code: "IND-MAIN" } },
    update: {},
    create: {
      orgId: org.id,
      branchId: branch3.id,
      name: "Indirapuram Store Room",
      code: "IND-MAIN",
    },
  });
  console.log(`✓ Warehouses: ${wh1.name}, ${wh2.name}, ${wh3.name}`);

  // ─── Storage Locations ────────────────────────────────────────────────
  const loc1 = await prisma.storageLocation.create({
    data: { warehouseId: wh1.id, name: "Shelf A1", code: "A1" },
  });
  const loc2 = await prisma.storageLocation.create({
    data: { warehouseId: wh1.id, name: "Shelf A2", code: "A2" },
  });
  const loc3 = await prisma.storageLocation.create({
    data: { warehouseId: wh2.id, name: "Shelf B1", code: "B1" },
  });
  console.log("✓ Storage locations created");

  // ─── Roles ─────────────────────────────────────────────────────────────
  const roles: Record<string, { name: string; slug: string; permissions: string[] }> = {
    SUPER_ADMIN: { name: "Super Admin", slug: "SUPER_ADMIN", permissions: ["*"] },
    OWNER: { name: "Owner", slug: "OWNER", permissions: ["dashboard:view", "org:manage", "products:manage", "inventory:view", "sales:create", "finance:view", "reports:view", "approvals:manage", "users:manage"] },
    SHOPKEEPER: { name: "Shopkeeper", slug: "SHOPKEEPER", permissions: ["dashboard:view", "pos:access", "sales:create", "sales:view", "customers:manage", "inventory:view"] },
    INVENTORY_MANAGER: { name: "Inventory Manager", slug: "INVENTORY_MANAGER", permissions: ["dashboard:view", "products:manage", "inventory:view", "inventory:adjust", "inventory:transfer", "inventory:count", "inventory:receive"] },
    STAFF: { name: "Staff", slug: "STAFF", permissions: ["dashboard:view", "pos:access", "sales:create", "customers:manage"] },
    PROCUREMENT: { name: "Procurement Officer", slug: "PROCUREMENT", permissions: ["dashboard:view", "suppliers:manage", "purchase:manage", "requisitions:manage", "inventory:view"] },
    ACCOUNTANT: { name: "Accountant", slug: "ACCOUNTANT", permissions: ["dashboard:view", "finance:view", "finance:manage", "reports:view", "sales:view"] },
    AUDITOR: { name: "Auditor", slug: "AUDITOR", permissions: ["dashboard:view", "audit:view", "reports:view", "finance:view"] },
  };

  const roleRecords: Record<string, { id: string }> = {};
  for (const [key, role] of Object.entries(roles)) {
    const record = await prisma.role.upsert({
      where: { orgId_slug: { orgId: org.id, slug: role.slug } },
      update: {},
      create: {
        orgId: org.id,
        name: role.name,
        slug: role.slug,
        permissions: role.permissions,
        isSystem: true,
      },
    });
    roleRecords[key] = record;
  }
  console.log("✓ Roles created");

  // ─── Users ────────────────────────────────────────────────────────────
  const demoPassword = process.env.DEMO_PASSWORD || "Demo@12345";
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const users = [
    { name: "Rajesh Kumar", email: "owner@urbanmart.demo", roleId: roleRecords.OWNER.id, branchId: branch1.id },
    { name: "Priya Sharma", email: "shopkeeper@urbanmart.demo", roleId: roleRecords.SHOPKEEPER.id, branchId: branch1.id },
    { name: "Amit Singh", email: "inventory@urbanmart.demo", roleId: roleRecords.INVENTORY_MANAGER.id, branchId: branch1.id },
    { name: "Sneha Gupta", email: "staff@urbanmart.demo", roleId: roleRecords.STAFF.id, branchId: branch1.id },
    { name: "Vikram Patel", email: "procurement@urbanmart.demo", roleId: roleRecords.PROCUREMENT.id, branchId: branch1.id },
    { name: "Anita Desai", email: "accountant@urbanmart.demo", roleId: roleRecords.ACCOUNTANT.id, branchId: branch1.id },
    { name: "Suresh Menon", email: "auditor@urbanmart.demo", roleId: roleRecords.AUDITOR.id, branchId: branch1.id },
    { name: "Platform Admin", email: "admin@urbanmart.demo", roleId: roleRecords.SUPER_ADMIN.id, branchId: branch1.id },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        orgId: org.id,
        roleId: userData.roleId,
        name: userData.name,
        email: userData.email,
        passwordHash,
        isDemo: true,
        branchAccess: {
          create: { branchId: userData.branchId, isPrimary: true },
        },
      },
    });
    console.log(`  ✓ User: ${user.name} (${user.email})`);
  }

  // ─── Categories ────────────────────────────────────────────────────────
  const categories = [
    { name: "Groceries", slug: "groceries" },
    { name: "Beverages", slug: "beverages" },
    { name: "Personal Care", slug: "personal-care" },
    { name: "Electronics Accessories", slug: "electronics-accessories" },
    { name: "Household", slug: "household" },
    { name: "Dairy", slug: "dairy" },
    { name: "Snacks", slug: "snacks" },
    { name: "Stationery", slug: "stationery" },
  ];

  const categoryRecords: Record<string, { id: string }> = {};
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { orgId: org.id, name: cat.name, slug: cat.slug },
    });
    categoryRecords[cat.slug] = record;
  }
  console.log("✓ Categories created");

  // ─── Suppliers ────────────────────────────────────────────────────────
  const suppliers = [
    { name: "IndiaMart Wholesale", contactName: "Rohit Agarwal", email: "rohit@indiamart.com", phone: "+91-9812345678", gstin: "07AABCI1234F1Z5" },
    { name: "Fresh Foods Distributors", contactName: "Meena Kumari", email: "meena@freshfoods.com", phone: "+91-9823456789", gstin: "07AABCF5678K1Z2" },
    { name: "TechAccess India", contactName: "Arjun Nair", email: "arjun@techaccess.com", phone: "+91-9834567890", gstin: "07AABCT9012M1Z8" },
    { name: "HomeEssentials Corp", contactName: "Kavita Joshi", email: "kavita@homeessentials.com", phone: "+91-9845678901", gstin: "07AABCH3456P1Z4" },
    { name: "DairyBest Suppliers", contactName: "Ravi Shankar", email: "ravi@dairybest.com", phone: "+91-9856789012", gstin: "07AABCD7890R1Z6" },
    { name: "SnackNation", contactName: "Pooja Verma", email: "pooja@snacknation.com", phone: "+91-9867890123", gstin: "07AABCS1234T1Z9" },
  ];

  const supplierRecords: Record<string, { id: string }> = {};
  for (const sup of suppliers) {
    const record = await prisma.supplier.upsert({
      where: { id: "" },
      update: {},
      create: { orgId: org.id, ...sup },
    }).catch(async () => {
      return prisma.supplier.findFirst({ where: { orgId: org.id, name: sup.name } });
    });
    if (record) supplierRecords[sup.name] = record as { id: string };
  }
  console.log("✓ Suppliers created");

  // ─── Products ─────────────────────────────────────────────────────────
  const products = [
    // Groceries
    { name: "Basmati Rice 5kg", sku: "GRC-RICE-5KG", category: "groceries", purchaseCost: 450, sellingPrice: 599, reorderLevel: 20, reorderQty: 50 },
    { name: "Wheat Flour 10kg", sku: "GRC-FLOUR-10KG", category: "groceries", purchaseCost: 350, sellingPrice: 449, reorderLevel: 15, reorderQty: 40 },
    { name: "Toor Dal 1kg", sku: "GRC-DAL-1KG", category: "groceries", purchaseCost: 120, sellingPrice: 159, reorderLevel: 25, reorderQty: 60 },
    { name: "Sugar 1kg", sku: "GRC-SUGAR-1KG", category: "groceries", purchaseCost: 45, sellingPrice: 59, reorderLevel: 30, reorderQty: 80 },
    { name: "Salt 1kg", sku: "GRC-SALT-1KG", category: "groceries", purchaseCost: 20, sellingPrice: 28, reorderLevel: 40, reorderQty: 100 },
    // Beverages
    { name: "Coca-Cola 1.25L", sku: "BEV-COKE-1.25L", category: "beverages", purchaseCost: 60, sellingPrice: 75, reorderLevel: 50, reorderQty: 120 },
    { name: "Pepsi 1.25L", sku: "BEV-PEPSI-1.25L", category: "beverages", purchaseCost: 55, sellingPrice: 70, reorderLevel: 50, reorderQty: 120 },
    { name: "Frooti Mango 1L", sku: "BEV-FROOTI-1L", category: "beverages", purchaseCost: 45, sellingPrice: 60, reorderLevel: 40, reorderQty: 100 },
    { name: "Bisleri Water 1L", sku: "BEV-BISLERI-1L", category: "beverages", purchaseCost: 12, sellingPrice: 20, reorderLevel: 100, reorderQty: 240 },
    { name: "Red Bull 250ml", sku: "BEV-REDBULL-250", category: "beverages", purchaseCost: 95, sellingPrice: 115, reorderLevel: 30, reorderQty: 72 },
    // Personal Care
    { name: "Colgate Toothpaste 200g", sku: "PC-COLGATE-200G", category: "personal-care", purchaseCost: 85, sellingPrice: 110, reorderLevel: 30, reorderQty: 80 },
    { name: "Dettol Handwash 200ml", sku: "PC-DETTOL-200ML", category: "personal-care", purchaseCost: 75, sellingPrice: 99, reorderLevel: 25, reorderQty: 60 },
    { name: "Parachute Coconut Oil 250ml", sku: "PC-PARACHUTE-250", category: "personal-care", purchaseCost: 90, sellingPrice: 120, reorderLevel: 20, reorderQty: 50 },
    { name: "Dove Soap 100g", sku: "PC-DOVE-100G", category: "personal-care", purchaseCost: 35, sellingPrice: 50, reorderLevel: 40, reorderQty: 100 },
    // Electronics Accessories
    { name: "USB-C Cable 1m", sku: "EA-USBC-1M", category: "electronics-accessories", purchaseCost: 150, sellingPrice: 299, reorderLevel: 15, reorderQty: 40 },
    { name: "Phone Case iPhone 14", sku: "EA-CASE-IP14", category: "electronics-accessories", purchaseCost: 200, sellingPrice: 499, reorderLevel: 10, reorderQty: 25 },
    { name: "Wireless Earbuds", sku: "EA-EARBUDS-BT", category: "electronics-accessories", purchaseCost: 800, sellingPrice: 1499, reorderLevel: 8, reorderQty: 20 },
    { name: "Power Bank 10000mAh", sku: "EA-PB-10000", category: "electronics-accessories", purchaseCost: 600, sellingPrice: 1299, reorderLevel: 10, reorderQty: 25 },
    // Household
    { name: "Vim Dish Gel 500ml", sku: "HH-VIM-500ML", category: "household", purchaseCost: 90, sellingPrice: 120, reorderLevel: 30, reorderQty: 80 },
    { name: "Lizol Floor Cleaner 500ml", sku: "HH-LIZOL-500ML", category: "household", purchaseCost: 110, sellingPrice: 149, reorderLevel: 25, reorderQty: 60 },
    { name: "Harpic Toilet Cleaner 500ml", sku: "HH-HARPIC-500ML", category: "household", purchaseCost: 95, sellingPrice: 129, reorderLevel: 25, reorderQty: 60 },
    { name: "Maggi Noodles 70g", sku: "SN-MAGGI-70G", category: "snacks", purchaseCost: 12, sellingPrice: 14, reorderLevel: 100, reorderQty: 200 },
    // Dairy
    { name: "Amul Milk 1L", sku: "DY-AMUL-1L", category: "dairy", purchaseCost: 55, sellingPrice: 66, reorderLevel: 50, reorderQty: 120, hasExpiry: true, hasBatch: true },
    { name: "Amul Butter 500g", sku: "DY-BUTTER-500G", category: "dairy", purchaseCost: 250, sellingPrice: 285, reorderLevel: 20, reorderQty: 50, hasExpiry: true, hasBatch: true },
    { name: "Curd 400g", sku: "DY-CURD-400G", category: "dairy", purchaseCost: 25, sellingPrice: 35, reorderLevel: 40, reorderQty: 100, hasExpiry: true, hasBatch: true },
    // Snacks
    { name: "Lays Masala 90g", sku: "SN-LAYS-90G", category: "snacks", purchaseCost: 35, sellingPrice: 50, reorderLevel: 60, reorderQty: 150 },
    { name: "Parle-G Gold 100g", sku: "SN-PARLEG-100G", category: "snacks", purchaseCost: 15, sellingPrice: 20, reorderLevel: 80, reorderQty: 200 },
    { name: "Britannia Good Day 200g", sku: "SN-GOODDAY-200G", category: "snacks", purchaseCost: 25, sellingPrice: 35, reorderLevel: 50, reorderQty: 120 },
    // Stationery
    { name: "Pilot V5 Pen", sku: "ST-PILOT-V5", category: "stationery", purchaseCost: 40, sellingPrice: 55, reorderLevel: 30, reorderQty: 80 },
    { name: "Classmate Notebook 200pg", sku: "ST-CLASSMATE-200", category: "stationery", purchaseCost: 45, sellingPrice: 65, reorderLevel: 40, reorderQty: 100 },
  ];

  const productRecords: Record<string, { id: string }> = {};
  for (const prod of products) {
    const record = await prisma.product.create({
      data: {
        orgId: org.id,
        categoryId: categoryRecords[prod.category]?.id,
        name: prod.name,
        sku: prod.sku,
        unit: "pcs",
        purchaseCost: prod.purchaseCost,
        sellingPrice: prod.sellingPrice,
        taxRate: 18,
        reorderLevel: prod.reorderLevel,
        reorderQty: prod.reorderQty,
        hasExpiry: prod.hasExpiry || false,
        hasBatch: prod.hasBatch || false,
        barcode: `890${Math.floor(Math.random() * 10000000000).toString().padStart(10, "0")}`,
      },
    });
    productRecords[prod.sku] = record;
  }
  console.log(`✓ Products: ${products.length} created`);

  // ─── Stock Batches ─────────────────────────────────────────────────────
  const batches = [
    { productSku: "DY-AMUL-1L", batchNumber: "AM-2026-001", quantity: 50, remainingQty: 50, unitCost: 55, expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
    { productSku: "DY-AMUL-1L", batchNumber: "AM-2026-002", quantity: 30, remainingQty: 30, unitCost: 55, expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    { productSku: "DY-BUTTER-500G", batchNumber: "BT-2026-001", quantity: 20, remainingQty: 20, unitCost: 250, expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
    { productSku: "DY-CURD-400G", batchNumber: "CD-2026-001", quantity: 40, remainingQty: 40, unitCost: 25, expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
    { productSku: "DY-CURD-400G", batchNumber: "CD-2026-002", quantity: 30, remainingQty: 30, unitCost: 25, expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) },
  ];

  for (const batch of batches) {
    const product = productRecords[batch.productSku];
    if (!product) continue;
    await prisma.stockBatch.create({
      data: {
        orgId: org.id,
        productId: product.id,
        batchNumber: batch.batchNumber,
        quantity: batch.quantity,
        remainingQty: batch.remainingQty,
        unitCost: batch.unitCost,
        expiryDate: batch.expiryDate,
        mfgDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log("✓ Stock batches created");

  // ─── Inventory Balances ───────────────────────────────────────────────
  // Create stock for each product at each branch
  const branchWarehouseMap = [
    { branchId: branch1.id, warehouseId: wh1.id },
    { branchId: branch2.id, warehouseId: wh2.id },
    { branchId: branch3.id, warehouseId: wh3.id },
  ];

  for (const [sku, product] of Object.entries(productRecords)) {
    for (const bw of branchWarehouseMap) {
      // Vary stock levels - some low, some out, most healthy
      let quantity = Math.floor(Math.random() * 50) + 10;
      if (["GRC-SALT-1KG", "SN-MAGGI-70G"].includes(sku)) quantity = 0; // out of stock
      if (["GRC-RICE-5KG", "BEV-COKE-1.25L", "PC-DOVE-100G"].includes(sku)) quantity = Math.floor(Math.random() * 5) + 1; // low stock

      const productData = products.find((p) => p.sku === sku);
      await prisma.inventoryBalance.create({
        data: {
          orgId: org.id,
          productId: product.id,
          branchId: bw.branchId,
          warehouseId: bw.warehouseId,
          quantity,
          reserved: 0,
          damaged: 0,
          quarantined: 0,
          inTransit: 0,
          avgCost: productData?.purchaseCost || 0,
        },
      });
    }
  }
  console.log("✓ Inventory balances created");

  // ─── Customers ────────────────────────────────────────────────────────
  const customerNames = [
    "Rahul Verma", "Sunita Devi", "Arjun Kumar", "Priya Sharma", "Rohit Gupta",
    "Neha Singh", "Vikram Joshi", "Anjali Patel", "Suresh Kumar", "Meena Devi",
    "Amit Sharma", "Kavita Singh", "Rajesh Kumar", "Pooja Gupta", "Sanjay Verma",
  ];

  const customerRecords: { id: string }[] = [];
  for (let i = 0; i < customerNames.length; i++) {
    const customer = await prisma.customer.create({
      data: {
        orgId: org.id,
        name: customerNames[i],
        email: i % 3 === 0 ? `customer${i}@gmail.com` : null,
        phone: `+91-98${Math.floor(Math.random() * 100000000).toString().padStart(8, "0")}`,
        address: `${i + 1}, Main Road, Ghaziabad`,
      },
    });
    customerRecords.push(customer);
  }
  console.log(`✓ Customers: ${customerRecords.length} created`);

  // ─── Stock Movements ──────────────────────────────────────────────────
  const movementTypes: MovementType[] = ["RECEIPT", "ISSUE", "TRANSFER_IN", "TRANSFER_OUT", "ADJUSTMENT", "RETURN"];
  for (let i = 0; i < 15; i++) {
    const product = Object.values(productRecords)[Math.floor(Math.random() * Object.keys(productRecords).length)];
    const bw = branchWarehouseMap[Math.floor(Math.random() * branchWarehouseMap.length)];
    const type = movementTypes[Math.floor(Math.random() * movementTypes.length)];
    const quantity = Math.floor(Math.random() * 20) + 1;

    await prisma.stockMovement.create({
      data: {
        orgId: org.id,
        productId: product.id,
        branchId: bw.branchId,
        warehouseId: bw.warehouseId,
        type,
        quantity: type === "ISSUE" || type === "TRANSFER_OUT" ? -quantity : quantity,
        beforeQty: 50,
        afterQty: 50 + (type === "ISSUE" || type === "TRANSFER_OUT" ? -quantity : quantity),
        referenceType: "SEED",
        userId: (await prisma.user.findFirst({ where: { email: "owner@urbanmart.demo" } }))?.id!,
      },
    });
  }
  console.log("✓ Stock movements created");

  // ─── Purchase Orders ───────────────────────────────────────────────────
  const supplierIds = Object.values(supplierRecords).map((s) => s.id);
  const productIds = Object.values(productRecords).map((p) => p.id);

  const poStatuses = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"];
  for (let i = 0; i < 10; i++) {
    const status = poStatuses[i % poStatuses.length];
    const supplier = await prisma.supplier.findFirst({ where: { orgId: org.id, id: supplierIds[i % supplierIds.length] } });
    if (!supplier) continue;

    const itemCount = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let totalAmount = 0;
    for (let j = 0; j < itemCount; j++) {
      const prod = await prisma.product.findFirst({ where: { orgId: org.id, id: productIds[(i * 3 + j) % productIds.length] } });
      if (!prod) continue;
      const qty = Math.floor(Math.random() * 50) + 10;
      const price = Number(prod.purchaseCost);
      totalAmount += qty * price;
      items.push({
        productId: prod.id,
        quantity: qty,
        receivedQty: status === "RECEIVED" ? qty : status === "PARTIALLY_RECEIVED" ? Math.floor(qty / 2) : 0,
        unitPrice: price,
        totalPrice: qty * price,
      });
    }

    const poDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
    await prisma.purchaseOrder.create({
      data: {
        orgId: org.id,
        branchId: branch1.id,
        supplierId: supplier.id,
        orderNumber: `PO${poDate.getFullYear()}${String(poDate.getMonth() + 1).padStart(2, "0")}${String(poDate.getDate()).padStart(2, "0")}${String(i).padStart(4, "0")}`,
        orderDate: poDate,
        expectedDate: new Date(poDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        totalAmount,
        status: status as "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED",
        userId: (await prisma.user.findFirst({ where: { email: "procurement@urbanmart.demo" } }))?.id!,
        approvedBy: status === "APPROVED" || status === "RECEIVED" || status === "PARTIALLY_RECEIVED" ? (await prisma.user.findFirst({ where: { email: "owner@urbanmart.demo" } }))?.id! : null,
        items: { create: items },
      },
    });
  }
  console.log("✓ Purchase orders created");

  // ─── Goods Receipts ───────────────────────────────────────────────────
  const postedPOs = await prisma.purchaseOrder.findMany({
    where: { orgId: org.id, status: { in: ["APPROVED", "PARTIALLY_RECEIVED"] } },
    take: 8,
  });

  for (let i = 0; i < postedPOs.length; i++) {
    const po = postedPOs[i];
    const receiptDate = new Date(po.orderDate.getTime() + Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000);

    await prisma.goodsReceipt.create({
      data: {
        orgId: org.id,
        branchId: po.branchId,
        purchaseOrderId: po.id,
        supplierId: po.supplierId,
        receiptNumber: `GRN${receiptDate.getFullYear()}${String(receiptDate.getMonth() + 1).padStart(2, "0")}${String(receiptDate.getDate()).padStart(2, "0")}${String(i).padStart(4, "0")}`,
        receiptDate,
        status: "POSTED",
        userId: (await prisma.user.findFirst({ where: { email: "inventory@urbanmart.demo" } }))?.id!,
        items: {
          create: await Promise.all(
            (await prisma.purchaseOrderItem.findMany({ where: { orderId: po.id } })).map(async (item) => {
              const prod = await prisma.product.findUnique({ where: { id: item.productId } });
              return {
                productId: item.productId,
                quantity: i === 0 ? Math.floor(item.quantity / 2) : item.quantity, // First one is partial
                unitCost: Number(item.unitPrice),
                totalCost: Number(item.unitPrice) * (i === 0 ? Math.floor(item.quantity / 2) : item.quantity),
              };
            })
          ),
        },
      },
    });
  }
  console.log("✓ Goods receipts created");

  // ─── Sales (last 30 days) ─────────────────────────────────────────────
  const paymentMethods: PaymentMethod[] = ["CASH", "CARD", "UPI"];
  const saleStatuses = ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "REFUNDED", "PARTIALLY_REFUNDED"];

  for (let i = 0; i < 45; i++) {
    const saleDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
    const branch = branchWarehouseMap[Math.floor(Math.random() * branchWarehouseMap.length)];
    const itemCount = Math.floor(Math.random() * 4) + 1;
    const saleItems = [];
    let subtotal = 0;
    let taxTotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const prod = await prisma.product.findFirst({
        where: { orgId: org.id, id: productIds[Math.floor(Math.random() * productIds.length)] },
      });
      if (!prod) continue;
      const qty = Math.floor(Math.random() * 3) + 1;
      const price = Number(prod.sellingPrice);
      const itemTax = (price * qty * 18) / 100;
      subtotal += price * qty;
      taxTotal += itemTax;
      saleItems.push({
        productId: prod.id,
        quantity: qty,
        unitPrice: price,
        discount: 0,
        taxRate: 18,
        totalPrice: price * qty,
      });
    }

    const totalAmount = subtotal + taxTotal;
    const status = saleStatuses[Math.floor(Math.random() * saleStatuses.length)];
    const customer = customerRecords[Math.floor(Math.random() * customerRecords.length)];
    const cashier = await prisma.user.findFirst({ where: { email: "staff@urbanmart.demo" } });

    await prisma.sale.create({
      data: {
        orgId: org.id,
        branchId: branch.branchId,
        userId: cashier?.id!,
        customerId: Math.random() > 0.3 ? customer.id : null,
        invoiceNumber: `INV${saleDate.getFullYear()}${String(saleDate.getMonth() + 1).padStart(2, "0")}${String(saleDate.getDate()).padStart(2, "0")}${String(i).padStart(4, "0")}`,
        invoiceDate: saleDate,
        subtotal,
        discountTotal: 0,
        taxTotal,
        totalAmount,
        amountPaid: totalAmount,
        status: status as "COMPLETED" | "REFUNDED" | "PARTIALLY_REFUNDED",
        items: { create: saleItems },
        payments: {
          create: {
            orgId: org.id,
            amount: totalAmount,
            method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            status: "COMPLETED",
            isSimulated: true,
            userId: cashier?.id!,
          },
        },
      },
    });
  }
  console.log("✓ Sales created");

  // ─── Refunds ──────────────────────────────────────────────────────────
  const completedSales = await prisma.sale.findMany({
    where: { orgId: org.id, status: "COMPLETED" },
    take: 5,
  });

  for (let i = 0; i < completedSales.length; i++) {
    const sale = completedSales[i];
    await prisma.refund.create({
      data: {
        orgId: org.id,
        saleId: sale.id,
        amount: Number(sale.totalAmount) * 0.5,
        reason: ["Customer complaint", "Product damaged", "Wrong item delivered", "Quality issue", "Customer changed mind"][i],
        status: i < 3 ? "APPROVED" : "PENDING",
        userId: (await prisma.user.findFirst({ where: { email: "staff@urbanmart.demo" } }))?.id!,
        approvedBy: i < 3 ? (await prisma.user.findFirst({ where: { email: "owner@urbanmart.demo" } }))?.id! : null,
      },
    });
  }
  console.log("✓ Refunds created");

  // ─── Expenses ─────────────────────────────────────────────────────────
  const expenseCategories = ["RENT", "UTILITIES", "SALARIES", "MAINTENANCE", "SUPPLIES", "MARKETING"];
  for (let i = 0; i < 12; i++) {
    await prisma.expense.create({
      data: {
        orgId: org.id,
        branchId: branch1.id,
        category: expenseCategories[i % expenseCategories.length],
        amount: Math.floor(Math.random() * 5000) + 500,
        description: `Monthly ${expenseCategories[i % expenseCategories.length].toLowerCase()} expense`,
        expenseDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        userId: (await prisma.user.findFirst({ where: { email: "accountant@urbanmart.demo" } }))?.id!,
      },
    });
  }
  console.log("✓ Expenses created");

  // ─── Approvals ────────────────────────────────────────────────────────
  const approvalTypes: ApprovalType[] = ["PURCHASE_ORDER", "STOCK_ADJUSTMENT", "REFUND", "STOCK_TRANSFER"];
  const approvalStatuses = ["PENDING", "APPROVED", "REJECTED", "PENDING", "APPROVED"];
  for (let i = 0; i < 8; i++) {
    await prisma.approvalRequest.create({
      data: {
        orgId: org.id,
        branchId: branch1.id,
        type: approvalTypes[i % approvalTypes.length],
        referenceType: "SEED",
        referenceId: `seed-${i}`,
        status: approvalStatuses[i % approvalStatuses.length] as "PENDING" | "APPROVED" | "REJECTED",
        requestedBy: (await prisma.user.findFirst({ where: { email: "staff@urbanmart.demo" } }))?.id!,
        reviewedBy: approvalStatuses[i % approvalStatuses.length] !== "PENDING" ? (await prisma.user.findFirst({ where: { email: "owner@urbanmart.demo" } }))?.id : null,
      },
    });
  }
  console.log("✓ Approvals created");

  // ─── Notifications ────────────────────────────────────────────────────
  const notificationTypes: NotificationType[] = ["LOW_STOCK", "OUT_OF_STOCK", "EXPIRY", "APPROVAL", "TRANSFER", "REFUND", "SYSTEM"];
  for (let i = 0; i < 10; i++) {
    await prisma.notification.create({
      data: {
        orgId: org.id,
        branchId: branch1.id,
        userId: (await prisma.user.findFirst({ where: { email: "owner@urbanmart.demo" } }))?.id!,
        title: `${notificationTypes[i % notificationTypes.length]} Alert`,
        message: `Sample ${notificationTypes[i % notificationTypes.length].toLowerCase()} notification for demonstration`,
        type: notificationTypes[i % notificationTypes.length],
        isRead: i > 5,
      },
    });
  }
  console.log("✓ Notifications created");

  // ─── Audit Logs ───────────────────────────────────────────────────────
  const auditActions = ["LOGIN", "LOGOUT", "CREATED", "UPDATED", "DELETED", "APPROVED", "REJECTED", "EXPORTED"];
  const entityTypes = ["Product", "Sale", "PurchaseOrder", "Customer", "User", "StockAdjustment"];
  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.findFirst({
      where: { orgId: org.id },
      skip: Math.floor(Math.random() * 8),
    });
    await prisma.auditLog.create({
      data: {
        orgId: org.id,
        branchId: branch1.id,
        userId: user?.id,
        action: auditActions[Math.floor(Math.random() * auditActions.length)],
        entityType: entityTypes[Math.floor(Math.random() * entityTypes.length)],
        entityId: `seed-${i}`,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log("✓ Audit logs created");

  // ─── Shifts ───────────────────────────────────────────────────────────
  for (let i = 0; i < 5; i++) {
    const shiftUser = await prisma.user.findFirst({ where: { email: "staff@urbanmart.demo" } });
    const openTime = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
    const closeTime = new Date(openTime.getTime() + 8 * 60 * 60 * 1000);
    await prisma.shift.create({
      data: {
        orgId: org.id,
        branchId: branch1.id,
        userId: shiftUser?.id!,
        openedAt: openTime,
        closedAt: i < 3 ? closeTime : null,
        openingCash: 5000,
        closingCash: i < 3 ? 5000 + Math.floor(Math.random() * 10000) : null,
        status: i < 3 ? "CLOSED" : "OPEN",
      },
    });
  }
  console.log("✓ Shifts created");

  // ─── System Settings ──────────────────────────────────────────────────
  const systemSettings = [
    { key: "tax_rate", value: { rate: 18, type: "GST" } },
    { key: "discount_limits", value: { staff: 5, shopkeeper: 10, owner: 20 } },
    { key: "approval_thresholds", value: { purchase_order: 10000, refund: 5000, adjustment: 2000 } },
    { key: "reorder_rules", value: { auto_reorder: false, safety_stock_days: 7 } },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { orgId_key: { orgId: org.id, key: setting.key } },
      update: {},
      create: {
        orgId: org.id,
        key: setting.key,
        value: setting.value as object,
      },
    });
  }
  console.log("✓ System settings created");

  console.log("\n✅ Seed complete!");
  console.log("\nDemo credentials (password: Demo@12345):");
  console.log("  owner@urbanmart.demo      — Owner");
  console.log("  shopkeeper@urbanmart.demo  — Shopkeeper");
  console.log("  inventory@urbanmart.demo   — Inventory Manager");
  console.log("  staff@urbanmart.demo       — Staff");
  console.log("  procurement@urbanmart.demo — Procurement Officer");
  console.log("  accountant@urbanmart.demo  — Accountant");
  console.log("  auditor@urbanmart.demo      — Auditor");
  console.log("  admin@urbanmart.demo       — Super Admin");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
