export type InventoryItem = {
  barcode: string;
  name: string;
  category: string;
  material: string;
  dimensions: string;
  image_url: string;
  salePrice: number;
  current_amount: number;
  min_amount: number;
  max_amount: number;
};

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

export const inventoryItems: InventoryItem[] = Array.from(
  { length: 120 },
  (_, index) => {
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
      image_url: `https://placehold.co/80x80?text=${category.image}`,
      salePrice: 1250 + (index % 12) * 375 + Math.floor(index / 12) * 120,
      current_amount: currentAmount,
      min_amount: minAmount,
      max_amount: maxAmount,
    };
  },
);
