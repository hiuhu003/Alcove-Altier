import { PrismaClient } from "@prisma/client";
import { PRODUCTS, CATEGORIES } from "../src/data/catalogue";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Alcove Atelier catalogue…");

  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        name: c.name,
        blurb: c.blurb,
        image: c.image,
        order: i,
      },
    });
  }

  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        category: p.category,
        price: p.price,
        compareAt: p.compareAt ?? null,
        shortDesc: p.shortDesc,
        description: p.description,
        images: JSON.stringify(p.images),
        colors: JSON.stringify(p.colors),
        sizes: JSON.stringify(p.sizes),
        materials: p.materials ? JSON.stringify(p.materials) : null,
        featured: p.featured,
        bespoke: p.bespoke,
        inStock: p.inStock,
        rating: p.rating,
        reviews: p.reviews,
        published: true,
        createdAt: new Date(p.createdAt),
      },
    });
  }

  const count = await prisma.product.count();
  console.log(`Done. ${count} products in the database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
