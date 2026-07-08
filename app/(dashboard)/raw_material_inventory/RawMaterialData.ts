export type Factory = {
  id: string;
  name: string;
  city: string;
};

export type RawMaterialItem = {
  barcode: string;
  factoryId: string;
  factoryName: string;
  resourceType: string;
  category: string;
  unit: string;
  currentAmount: number;
  minAmount: number;
  maxAmount: number;
};

export const factories: Factory[] = [
  { id: "cairo-main", name: "مصنع القاهرة الرئيسي", city: "القاهرة" },
  { id: "alex-wood", name: "مصنع الإسكندرية للأخشاب", city: "الإسكندرية" },
  { id: "obour-metal", name: "مصنع العبور للمعادن", city: "العبور" },
  { id: "giza-upholstery", name: "مصنع الجيزة للتنجيد", city: "الجيزة" },
];

const rawMaterials = [
  { resourceType: "Glass 10m", category: "Glass", unit: "sheet" },
  { resourceType: "Glass 20m", category: "Glass", unit: "sheet" },
  { resourceType: "Tempered Glass 8mm", category: "Glass", unit: "sheet" },
  { resourceType: "Leather", category: "Leather", unit: "meter" },
  { resourceType: "Brown Leather", category: "Leather", unit: "meter" },
  { resourceType: "Black Leather", category: "Leather", unit: "meter" },
  { resourceType: "Stainless Steel 10x5", category: "Metal", unit: "bar" },
  { resourceType: "Stainless Steel 20x10", category: "Metal", unit: "bar" },
  { resourceType: "Aluminum Profile 6m", category: "Metal", unit: "bar" },
  { resourceType: "MDF Board 18mm", category: "Wood", unit: "board" },
  { resourceType: "Oak Wood 2m", category: "Wood", unit: "piece" },
  { resourceType: "Beech Wood 3m", category: "Wood", unit: "piece" },
  { resourceType: "Velvet Fabric", category: "Fabric", unit: "meter" },
  { resourceType: "Linen Fabric", category: "Fabric", unit: "meter" },
  { resourceType: "Foam 35 Density", category: "Upholstery", unit: "piece" },
  { resourceType: "Hinges Soft Close", category: "Hardware", unit: "piece" },
  { resourceType: "Drawer Rail 45cm", category: "Hardware", unit: "piece" },
  { resourceType: "Wood Glue", category: "Chemicals", unit: "kg" },
  { resourceType: "Clear Lacquer", category: "Finishing", unit: "liter" },
  { resourceType: "Carrara Marble 2cm", category: "Stone", unit: "slab" },
];

export const rawMaterialItems: RawMaterialItem[] = Array.from(
  { length: 160 },
  (_, index) => {
    const factory = factories[index % factories.length];
    const material = rawMaterials[index % rawMaterials.length];
    const minAmount = 20 + (index % 8) * 10;
    const maxAmount = minAmount + 140 + (index % 6) * 25;
    const currentAmount =
      index % 23 === 0
        ? 0
        : index % 9 === 0
          ? Math.max(1, minAmount - 8)
          : minAmount + ((index * 19) % (maxAmount - minAmount));

    return {
      barcode: String(410000000000 + (index + 1) * 3571),
      factoryId: factory.id,
      factoryName: factory.name,
      resourceType: material.resourceType,
      category: material.category,
      unit: material.unit,
      currentAmount,
      minAmount,
      maxAmount,
    };
  },
);
