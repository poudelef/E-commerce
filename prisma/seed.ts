import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/types";
import { slugify } from "../src/lib/slug";
import { addDays, zonedParts } from "../src/lib/time";

const prisma = new PrismaClient();
const reset = process.argv.includes("--reset");

const tints: Record<string, string> = {
  "Grocery Staples": "#F6D48A",
  "Rice & Flour": "#F3E2B3",
  "Pulses & Lentils": "#E7C99A",
  Spices: "#F0B27A",
  "Oils & Ghee": "#F6D56A",
  Snacks: "#F7C1A0",
  Beverages: "#B7E4C7",
  Dairy: "#F7E7C1",
  "Fruits & Vegetables": "#C8E7A6",
  "Personal Care": "#F6C1D2",
  Household: "#C9E7F2",
};

type SeedProduct = {
  category: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  low?: number;
  keywords: string;
  description: string;
  emoji: string;
};

const products: SeedProduct[] = [
  ["Grocery Staples", "Tata Salt", "1 kg", 28, 80, "salt, namak, iodised", "Iodised salt for everyday cooking.", "🧂"],
  ["Grocery Staples", "Sugar", "1 kg", 48, 60, "sugar, cheeni, sweet", "Fine sugar for tea, sweets, and baking.", "🍬"],
  ["Grocery Staples", "Jaggery", "500 g", 65, 30, "jaggery, gur, gud", "Traditional solid jaggery with a caramel taste.", "🟫"],
  ["Grocery Staples", "Poha", "500 g", 42, 36, "poha, flattened rice, chivda", "Flattened rice that cooks in minutes.", "🥣"],
  ["Grocery Staples", "Vermicelli", "400 g", 38, 24, "vermicelli, semiya, seviyan", "Roasted vermicelli for upma and kheer.", "🍜"],
  ["Rice & Flour", "Basmati Rice", "1 kg", 165, 40, "basmati, rice, chawal, biryani, basmti", "Long-grain basmati for biryani and pulao.", "🍚"],
  ["Rice & Flour", "Sona Masoori Rice", "5 kg", 420, 22, "sona masoori, rice, daily rice", "Light everyday rice for the family pot.", "🍚"],
  ["Rice & Flour", "Wheat Atta", "5 kg", 280, 28, "atta, aata, wheat flour, chapati, roti", "Chakki-style wheat flour for soft rotis.", "🌾"],
  ["Rice & Flour", "Besan", "500 g", 70, 26, "besan, gram flour, chickpea flour", "Gram flour for pakoras and laddoos.", "🟡"],
  ["Rice & Flour", "Rava", "500 g", 45, 20, "rava, sooji, semolina, upma", "Semolina for upma, halwa, and rava dosa.", "🌾"],
  ["Rice & Flour", "Maida", "1 kg", 52, 18, "maida, refined flour, all purpose", "Refined flour for snacks and baking.", "🥖"],
  ["Pulses & Lentils", "Toor Dal", "1 kg", 160, 34, "toor, arhar, dal, tur", "Split pigeon peas for sambar and dal fry.", "🫘"],
  ["Pulses & Lentils", "Moong Dal", "1 kg", 145, 30, "moong, mung, yellow dal", "Yellow moong dal, light and quick to cook.", "🫘"],
  ["Pulses & Lentils", "Masoor Dal", "1 kg", 120, 28, "masoor, red lentil, dal", "Red lentils that soften quickly.", "🫘"],
  ["Pulses & Lentils", "Chana Dal", "1 kg", 110, 26, "chana dal, bengal gram", "Split chickpeas for dal and sweets.", "🫘"],
  ["Pulses & Lentils", "Kabuli Chana", "500 g", 85, 0, "kabuli chana, chickpeas, chole", "White chickpeas for chole. Restocking soon.", "⚪"],
  ["Pulses & Lentils", "Rajma", "500 g", 95, 16, "rajma, kidney beans", "Red kidney beans for rajma masala.", "🫘"],
  ["Spices", "Turmeric Powder", "100 g", 42, 40, "turmeric, haldi, powder", "Bright turmeric for colour and tempering.", "🟡"],
  ["Spices", "Red Chilli Powder", "100 g", 48, 36, "chilli, chili, mirchi, lal mirch", "Medium-hot chilli powder.", "🌶️"],
  ["Spices", "Coriander Powder", "100 g", 36, 32, "coriander, dhania, powder", "Fresh-ground coriander powder.", "🌿"],
  ["Spices", "Garam Masala", "50 g", 55, 22, "garam masala, spice mix", "Warm spice blend for the end of cooking.", "✨"],
  ["Spices", "Cumin Seeds", "100 g", 62, 20, "cumin, jeera, seeds", "Whole cumin for tadka.", "🌰"],
  ["Spices", "Mustard Seeds", "100 g", 28, 24, "mustard, rai, sarson", "Small black mustard seeds.", "⚫"],
  ["Oils & Ghee", "Sunflower Oil", "1 L", 145, 30, "sunflower, oil, cooking oil", "Neutral cooking oil for daily frying.", "🛢️"],
  ["Oils & Ghee", "Mustard Oil", "1 L", 165, 18, "mustard oil, sarson tel", "Pungent mustard oil for pickles and tadka.", "🛢️"],
  ["Oils & Ghee", "Groundnut Oil", "1 L", 190, 14, "groundnut, peanut oil", "Peanut oil with a nutty aroma.", "🥜"],
  ["Oils & Ghee", "Cow Ghee", "500 ml", 320, 12, "ghee, ghee, clarified butter", "Slow-cooked cow ghee.", "🧈"],
  ["Oils & Ghee", "Coconut Oil", "500 ml", 180, 10, "coconut oil, nariyal", "Pure coconut oil for cooking and hair.", "🥥"],
  ["Snacks", "Namkeen Mixture", "200 g", 55, 24, "namkeen, mixture, snack", "Crunchy sev mixture.", "🥨"],
  ["Snacks", "Bhujia", "200 g", 48, 20, "bhujia, sev, snack", "Thin spicy bhujia.", "🥨"],
  ["Snacks", "Marie Biscuits", "250 g", 35, 30, "marie, biscuit, tea biscuit", "Light tea-time biscuits.", "🍪"],
  ["Snacks", "Glucose Biscuits", "100 g", 10, 48, "glucose, biscuit, parle", "A small pack of glucose biscuits.", "🍪"],
  ["Snacks", "Instant Noodles", "70 g", 14, 60, "noodles, maggi, instant", "Single pack of masala instant noodles.", "🍜"],
  ["Snacks", "Banana Chips", "150 g", 60, 3, "banana chips, wafers, nendran", "Salted banana chips. Only a few packs left.", "🍌", 5],
  ["Beverages", "Assam Tea", "250 g", 120, 22, "tea, chai, assam", "Strong Assam leaf tea for cutting chai.", "🍵"],
  ["Beverages", "Coffee Powder", "100 g", 95, 16, "coffee, filter coffee", "South-Indian style filter coffee powder.", "☕"],
  ["Beverages", "Mango Drink", "1 L", 70, 18, "mango, drink, juice", "Sweet mango drink, serve chilled.", "🥭"],
  ["Beverages", "Packaged Water", "1 L", 20, 80, "water, bottle, drinking water", "Sealed drinking water.", "💧"],
  ["Beverages", "Buttermilk", "200 ml", 15, 20, "buttermilk, chaas, mattha", "Spiced buttermilk. Keep chilled.", "🥛"],
  ["Dairy", "Toned Milk", "500 ml", 28, 24, "milk, doodh, toned", "Toned milk pouch. Refrigerate on arrival.", "🥛"],
  ["Dairy", "Curd", "400 g", 35, 16, "curd, dahi, yogurt", "Set curd with a clean, fresh taste.", "🥛"],
  ["Dairy", "Paneer", "200 g", 90, 10, "paneer, cottage cheese", "Fresh malai paneer.", "🧀"],
  ["Dairy", "Butter", "100 g", 55, 4, "butter, makhan", "Salted table butter. Running low.", "🧈", 6],
  ["Dairy", "Cheese Slices", "100 g", 75, 3, "cheese, slice, sandwich", "Processed cheese slices. Low stock.", "🧀", 5],
  ["Fruits & Vegetables", "Banana", "1 dozen", 50, 18, "banana, kela, robusta, fruit", "Robusta bananas. Tell us if you want them ripe.", "🍌"],
  ["Fruits & Vegetables", "Onion", "1 kg", 40, 40, "onion, pyaz, kanda", "Firm red onions.", "🧅"],
  ["Fruits & Vegetables", "Potato", "1 kg", 35, 40, "potato, aloo, batata", "Everyday potatoes for sabzi and fries.", "🥔"],
  ["Fruits & Vegetables", "Tomato", "1 kg", 45, 28, "tomato, tamatar", "Ripe tomatoes for gravy and salad.", "🍅"],
  ["Fruits & Vegetables", "Green Chilli", "100 g", 15, 2, "chilli, mirchi, green chilli", "Fresh green chillies. Very few left today.", "🌶️", 6],
  ["Fruits & Vegetables", "Coriander Leaves", "1 bunch", 12, 14, "coriander, kothmir, dhania leaves, cilantro", "A fresh bunch for garnish.", "🌿"],
  ["Fruits & Vegetables", "Apple", "1 kg", 180, 12, "apple, fruit, seb", "Crisp red apples.", "🍎"],
  ["Personal Care", "Bathing Soap", "125 g", 40, 30, "soap, bathing bar", "A gentle bathing bar.", "🧼"],
  ["Personal Care", "Shampoo", "180 ml", 95, 14, "shampoo, hair wash", "Daily shampoo for regular hair.", "🧴"],
  ["Personal Care", "Toothpaste", "150 g", 85, 18, "toothpaste, oral", "Fluoride toothpaste.", "😁"],
  ["Personal Care", "Coconut Hair Oil", "200 ml", 70, 12, "hair oil, coconut", "Coconut hair oil.", "🥥"],
  ["Personal Care", "Detergent Bar", "250 g", 20, 26, "detergent, soap bar, laundry", "Laundry detergent bar.", "🧼"],
  ["Household", "Dishwash Liquid", "500 ml", 85, 16, "dishwash, utensil, vim", "Lemon dishwash liquid.", "🍋"],
  ["Household", "Floor Cleaner", "1 L", 110, 12, "floor cleaner, phenyl", "Floral floor cleaner.", "🧹"],
  ["Household", "Garbage Bags", "30 pcs", 75, 14, "garbage bags, dustbin", "Medium garbage bags.", "🗑️"],
  ["Household", "Aluminium Foil", "9 m", 65, 10, "foil, aluminium, aluminum", "Kitchen foil for packing and baking.", "🧻"],
  ["Household", "Matchbox", "10 pcs", 20, 20, "matchbox, matches", "A pack of 10 matchboxes.", "🔥"],
].map((row) => {
  const [category, name, unit, price, stock, keywords, description, emoji, low] = row as [
    string,
    string,
    string,
    number,
    number,
    string,
    string,
    string,
    number?,
  ];
  return { category, name, unit, price, stock, keywords, description, emoji, low };
});

function writeImage(slug: string, emoji: string, tint: string) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#FFF1D1"/>
  <circle cx="400" cy="390" r="230" fill="${tint}"/>
  <text x="400" y="430" font-size="210" text-anchor="middle" dominant-baseline="central">${emoji}</text>
</svg>`;
  fs.writeFileSync(path.join(process.cwd(), "public", "products", `${slug}.svg`), svg, "utf8");
}

function productSlug(name: string, unit: string) {
  return slugify(`${name} ${unit}`);
}

async function seedCatalog() {
  fs.mkdirSync(path.join(process.cwd(), "public", "products"), { recursive: true });
  const names = [...new Set(products.map((product) => product.category))];
  const categories = new Map<string, string>();
  for (const [index, name] of names.entries()) {
    const category = await prisma.category.create({
      data: { name, slug: slugify(name), sortOrder: index },
    });
    categories.set(name, category.id);
  }

  for (const product of products) {
    const slug = productSlug(product.name, product.unit);
    writeImage(slug, product.emoji, tints[product.category] ?? "#F6D48A");
    await prisma.product.create({
      data: {
        name: product.name,
        slug,
        description: product.description,
        price: Math.round(product.price * 100),
        unit: product.unit,
        stock: product.stock,
        lowStockThreshold: product.low ?? 5,
        image: `/products/${slug}.svg`,
        keywords: product.keywords,
        active: true,
        categoryId: categories.get(product.category)!,
      },
    });
  }
}

async function seedOrders() {
  const tz = DEFAULT_SETTINGS.timezone;
  const today = zonedParts(new Date(), tz).date;
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  const upcoming = addDays(today, 3);

  const soon = zonedParts(new Date(Date.now() + 70 * 60 * 1000), tz);
  const later = zonedParts(new Date(Date.now() + 4 * 60 * 60 * 1000), tz);
  const roundStart = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    return `${String(hour).padStart(2, "0")}:${minute < 30 ? "00" : "30"}`;
  };
  const plus30 = (start: string) => {
    const [hour, minute] = start.split(":").map(Number);
    const total = hour * 60 + minute + 30;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  const soonStart = roundStart(soon.time);
  const laterStart = roundStart(later.time);

  const samples: {
    number: string;
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    date: string;
    start: string;
    status: string;
    lines: [string, string, number][];
    createdHoursAgo: number;
  }[] = [
    {
      number: "LKS-000001",
      name: "Rahul Deshmukh",
      phone: "+9779800000001",
      notes: "Please keep the dal separate from the rice.",
      date: yesterday,
      start: "18:00",
      status: "packing",
      lines: [
        ["Basmati Rice", "1 kg", 2],
        ["Toor Dal", "1 kg", 1],
        ["Turmeric Powder", "100 g", 1],
      ],
      createdHoursAgo: 26,
    },
    {
      number: "LKS-000002",
      name: "Priya Sharma",
      phone: "+9779800000002",
      email: "priya@example.com",
      notes: "Please pick ripe bananas.",
      date: soon.date,
      start: soonStart,
      status: "confirmed",
      lines: [
        ["Banana", "1 dozen", 1],
        ["Toned Milk", "500 ml", 2],
        ["Curd", "400 g", 1],
      ],
      createdHoursAgo: 1,
    },
    {
      number: "LKS-000003",
      name: "Anita Kulkarni",
      phone: "+9779800000003",
      date: later.date,
      start: laterStart,
      status: "new",
      lines: [
        ["Wheat Atta", "5 kg", 1],
        ["Sunflower Oil", "1 L", 1],
        ["Tata Salt", "1 kg", 2],
      ],
      createdHoursAgo: 0.4,
    },
    {
      number: "LKS-000004",
      name: "Mohammed Irfan",
      phone: "+9779800000004",
      date: today,
      start: "19:00",
      status: "new",
      lines: [
        ["Assam Tea", "250 g", 1],
        ["Marie Biscuits", "250 g", 2],
        ["Sugar", "1 kg", 1],
      ],
      createdHoursAgo: 2,
    },
    {
      number: "LKS-000005",
      name: "Sneha Patil",
      phone: "+9779800000005",
      date: tomorrow,
      start: "10:00",
      status: "confirmed",
      lines: [
        ["Paneer", "200 g", 1],
        ["Tomato", "1 kg", 1],
        ["Onion", "1 kg", 2],
        ["Coriander Leaves", "1 bunch", 1],
      ],
      createdHoursAgo: 5,
    },
    {
      number: "LKS-000006",
      name: "Vikram Joshi",
      phone: "+9779800000006",
      date: tomorrow,
      start: "17:30",
      status: "ready",
      lines: [
        ["Cow Ghee", "500 ml", 1],
        ["Rava", "500 g", 1],
      ],
      createdHoursAgo: 8,
    },
    {
      number: "LKS-000007",
      name: "Meera Iyer",
      phone: "+9779800000007",
      date: yesterday,
      start: "09:00",
      status: "completed",
      lines: [
        ["Instant Noodles", "70 g", 4],
        ["Bhujia", "200 g", 1],
      ],
      createdHoursAgo: 30,
    },
    {
      number: "LKS-000008",
      name: "Arjun Rao",
      phone: "+9779800000008",
      notes: "Customer asked to cancel.",
      date: today,
      start: "12:00",
      status: "cancelled",
      lines: [
        ["Shampoo", "180 ml", 1],
        ["Bathing Soap", "125 g", 2],
      ],
      createdHoursAgo: 6,
    },
  ];

  if (upcoming) {
    samples.push({
      number: "LKS-000009",
      name: "Lakshmi Nair",
      phone: "+9779800000009",
      date: upcoming,
      start: "11:00",
      status: "confirmed",
      lines: [
        ["Sona Masoori Rice", "5 kg", 1],
        ["Moong Dal", "1 kg", 1],
      ],
      createdHoursAgo: 3,
    });
  }

  for (const sample of samples) {
    let subtotal = 0;
    const items = [];
    for (const [name, unit, quantity] of sample.lines) {
      const product = await prisma.product.findFirst({ where: { name, unit } });
      if (!product) throw new Error(`Missing seed product ${name}`);
      subtotal += product.price * quantity;
      items.push({
        productId: product.id,
        name: product.name,
        unit: product.unit,
        unitPrice: product.price,
        quantity,
      });
      if (sample.status !== "cancelled") {
        await prisma.product.update({
          where: { id: product.id },
          data: { stock: { decrement: quantity } },
        });
      }
    }
    const createdAt = new Date(Date.now() - sample.createdHoursAgo * 60 * 60 * 1000);
    await prisma.order.create({
      data: {
        orderNumber: sample.number,
        customerName: sample.name,
        phone: sample.phone,
        email: sample.email ?? "",
        notes: sample.notes ?? "",
        fulfillmentType: "pickup",
        pickupDate: sample.date,
        pickupSlotStart: sample.start,
        pickupSlotEnd: plus30(sample.start),
        status: sample.status,
        subtotal,
        tax: 0,
        total: subtotal,
        createdAt,
        items: { create: items },
        statusEvents: {
          create: [
            { status: "new", note: "Order placed", createdAt },
            ...(sample.status === "new"
              ? []
              : [{ status: sample.status, note: "Status updated by owner", createdAt: new Date(createdAt.getTime() + 15 * 60 * 1000) }]),
          ],
        },
      },
    });
  }

  await prisma.storeSettings.update({
    where: { id: "default" },
    data: { orderCounter: samples.length },
  });
}

async function main() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  const name = process.env.OWNER_NAME?.trim() || "Store Owner";
  if (!email || !password) {
    throw new Error("Set OWNER_EMAIL and OWNER_PASSWORD before seeding.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  if (reset) {
    await prisma.orderEdit.deleteMany();
    await prisma.orderStatusEvent.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
  }

  const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    await prisma.storeSettings.create({
      data: {
        id: "default",
        storeName: DEFAULT_SETTINGS.storeName,
        address: DEFAULT_SETTINGS.address,
        phone: DEFAULT_SETTINGS.phone,
        email: DEFAULT_SETTINGS.email,
        hoursJson: JSON.stringify(DEFAULT_SETTINGS.hours),
        leadTimeMinutes: DEFAULT_SETTINGS.leadTimeMinutes,
        slotMinutes: DEFAULT_SETTINGS.slotMinutes,
        taxEnabled: false,
        taxBps: 0,
        timezone: DEFAULT_SETTINGS.timezone,
        orderCounter: 0,
      },
    });
  }

  if ((await prisma.product.count()) === 0) await seedCatalog();
  if ((await prisma.order.count()) === 0) await seedOrders();
  console.log(`Owner ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
