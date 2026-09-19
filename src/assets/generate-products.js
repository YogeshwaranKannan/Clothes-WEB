const fs = require('fs');

// Load categories JSON
const categories = require('./getCategories.json').categories;

// Sample image pool (real usable URLs)
const images = [
  "https://images.unsplash.com/photo-1586201375761-83865001e31c",
  "https://images.unsplash.com/photo-1603048719539-98c7a4c5b1b4",
  "https://images.unsplash.com/photo-1518972559570-7cc1309f3229",
  "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b",
  "https://images.unsplash.com/photo-1590080875515-8c3b3c2acb09",
  "https://images.unsplash.com/photo-1617196038435-8e8a4c63eb0d"
];

// Generic product name generator
function generateNames(category) {
  return [
    `${category} Premium`,
    `${category} Organic`,
    `${category} Standard`,
    `${category} Fresh Pack`,
    `${category} Value Pack`,
    `${category} Gold Quality`,
    `${category} Classic`,
    `${category} Natural`,
    `${category} Select`,
    `${category} Special`
  ];
}

let products = [];
let counter = 1;

categories.forEach(cat => {
  cat.children.forEach(child => {
    const names = generateNames(child.category);

    names.slice(0, 8).forEach(name => {
      products.push({
        inventoryId: `INV-${counter}`,
        sellerid: `SELLER00${(counter % 5) + 1}`,
        ProductId: `PROD-${counter}`,
        ProductName: name,
        SellingPrice: Math.floor(Math.random() * 200) + 50,
        AvilableQty: Math.floor(Math.random() * 100) + 10,
        Brand: "Swamy's",
        Size: ["500g", "1kg", "2kg", "5kg"][Math.floor(Math.random() * 4)],
        Gender: null,
        Speed: null,
        StockStatus: "In Stock",
        OfferPrice: `Rs. ${Math.floor(Math.random() * 200) + 40}.00`,
        DiscountPercent: `${Math.floor(Math.random() * 20)}%`,
        Category: {
          CategoryId: child.id,
          CategoryName: child.category
        },
        Batch_Id: `BATCH-${Date.now()}-${counter}`,
        batch_unit: "kg",
        Image: images[Math.floor(Math.random() * images.length)],
        isService: false,
        addons: null,
        isAttributePresent: false,
        CreatedAt: new Date().toISOString()
      });

      counter++;
    });
  });
});

// ✅ Final JSON
const output = {
  products: products
};

// Save file
fs.writeFileSync('getProducts.json', JSON.stringify(output, null, 2));

console.log(`✅ Generated ${products.length} products`);
