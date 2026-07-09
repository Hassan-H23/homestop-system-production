require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const productNames = [
  "Geometric Table",
  "Illume Table",
  "Eterna Table",
  "Two Levels Table",
  "Piano Table",
  "Golden Crest Table",
  "Marble Table",
  "Diamond Table",
  "Four Sector Table",
  "Rectangle Table",
  "Gloss Mirror",
  "Lustra Mirror",
  "Aria Sofa",
  "Nora Lounge Chair",
  "Crest Console",
  "Nova Bookshelf",
  "Luna Pendant Light",
  "Haven Bed Frame",
  "Metro Desk",
  "Velvet Ottoman",
];

const categories = [
  { name: "Tables", image: "Table" },
  { name: "Mirrors", image: "Mirror" },
  { name: "Sofas", image: "Sofa" },
  { name: "Chairs", image: "Chair" },
  { name: "Storage", image: "Storage" },
  { name: "Lighting", image: "Light" },
  { name: "Beds", image: "Bed" },
  { name: "Desks", image: "Desk" },
  { name: "Decor", image: "Decor" },
  { name: "Outdoor", image: "Outdoor" },
];

const materials = [
  "Wood",
  "Metal",
  "Glass",
  "Marble",
  "Rattan",
  "Fabric",
  "Leather",
  "Ceramic",
  "Velvet",
  "Wood & Metal",
];

const dimensions = [
  "120x60x45 cm",
  "100x50x40 cm",
  "140x70x45 cm",
  "110x55x50 cm",
  "130x60x45 cm",
  "90x90x40 cm",
  "180x85x75 cm",
  "75x75x90 cm",
  "200x160x110 cm",
  "60x40x160 cm",
];

const locations = [
  { name: "Cairo Showroom", code: "cairo-showroom", type: "showroom" },
  { name: "Giza Showroom", code: "giza-showroom", type: "showroom" },
  { name: "Main Warehouse", code: "main-warehouse", type: "warehouse" },
  { name: "Alexandria Branch", code: "alexandria-branch", type: "branch" },
];

function createProducts() {
  return Array.from({ length: 120 }, (_, index) => {
    const itemNumber = index + 1;
    const category = categories[index % categories.length];
    const minAmount = 8 + (index % 6) * 4;
    const maxAmount = minAmount + 80 + (index % 5) * 20;
    const currentAmount =
      index % 17 === 0
        ? 0
        : index % 9 === 0
          ? Math.max(1, minAmount - 3)
          : minAmount + (index * 7) % (maxAmount - minAmount);

    return {
      barcode: String(350000000000 + itemNumber * 7919),
      name: `${productNames[index % productNames.length]} ${String(itemNumber).padStart(3, "0")}`,
      category: category.name,
      material: materials[index % materials.length],
      dimensions: dimensions[index % dimensions.length],
      imageUrl: `https://placehold.co/80x80?text=${category.image}`,
      salePrice: 1250 + (index % 12) * 375 + Math.floor(index / 12) * 120,
      currentAmount,
      minAmount,
      maxAmount,
    };
  });
}

async function main() {
  const savedLocations = await Promise.all(
    locations.map((location) =>
      prisma.location.upsert({
        where: { code: location.code },
        create: location,
        update: location,
      }),
    ),
  );

  for (const item of createProducts()) {
    const product = await prisma.product.upsert({
      where: { barcode: item.barcode },
      create: {
        barcode: item.barcode,
        name: item.name,
        category: item.category,
        material: item.material,
        dimensions: item.dimensions,
        imageUrl: item.imageUrl,
        salePrice: item.salePrice,
      },
      update: {
        name: item.name,
        category: item.category,
        material: item.material,
        dimensions: item.dimensions,
        imageUrl: item.imageUrl,
        salePrice: item.salePrice,
      },
    });

    const location =
      savedLocations[Number(item.barcode.slice(-4)) % savedLocations.length];

    await prisma.productStock.upsert({
      where: {
        productId_locationId: {
          productId: product.product_id,
          locationId: location.location_id,
        },
      },
      create: {
        productId: product.product_id,
        locationId: location.location_id,
        currentAmount: item.currentAmount,
        minAmount: item.minAmount,
        maxAmount: item.maxAmount,
      },
      update: {
        currentAmount: item.currentAmount,
        minAmount: item.minAmount,
        maxAmount: item.maxAmount,
      },
    });
  }

  const productCount = await prisma.product.count();
  const stockCount = await prisma.productStock.count();

  console.log(`Seeded ${productCount} products and ${stockCount} stock rows.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
