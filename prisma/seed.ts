import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Electrical", slug: "electrical", icon: "⚡", skills: ["General Wiring", "Solar Installation", "Fault Finding", "Generator Repair"] },
  { name: "Plumbing", slug: "plumbing", icon: "🔧", skills: ["Pipe Installation", "Leak Repair", "Bathroom Fitting", "Water Tank"] },
  { name: "Cleaning", slug: "cleaning", icon: "🧹", skills: ["House Cleaning", "Office Cleaning", "Post-Construction", "Carpet Cleaning"] },
  { name: "Hair & Beauty", slug: "hair-beauty", icon: "✂️", skills: ["Hairdressing", "Barbering", "Braiding", "Makeup Artist", "Massage"] },
  { name: "Tailoring", slug: "tailoring", icon: "🧵", skills: ["Traditional Wear", "Western Wear", "Alterations", "Embroidery"] },
  { name: "Carpentry", slug: "carpentry", icon: "🪚", skills: ["Furniture Making", "Door/Window Fitting", "Cabinet Making", "Roofing"] },
  { name: "Masonry", slug: "masonry", icon: "🧱", skills: ["Block Laying", "Tiling", "Plastering", "Foundation Work"] },
  { name: "Laundry", slug: "laundry", icon: "👕", skills: ["Wash & Iron", "Dry Cleaning", "Pickup & Delivery"] },
  { name: "Cooking", slug: "cooking", icon: "🍳", skills: ["Home Chef", "Event Catering", "Meal Prep", "Pastry & Baking"] },
  { name: "Driving", slug: "driving", icon: "🚗", skills: ["Personal Driver", "Airport Transfers", "Errands", "School Run"] },
];

async function main() {
  console.log("Seeding categories and skills...");

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, icon: cat.icon },
    });

    for (const skillName of cat.skills) {
      await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName, categoryId: category.id },
      });
    }
  }

  await prisma.platformSetting.upsert({
    where: { key: "commission_percent" },
    update: {},
    create: { key: "commission_percent", value: "12" },
  });

  await prisma.platformSetting.upsert({
    where: { key: "registration_fee_sle" },
    update: {},
    create: { key: "registration_fee_sle", value: "150000" },
  });

  await prisma.platformSetting.upsert({
    where: { key: "worker_pro_monthly_sle" },
    update: {},
    create: { key: "worker_pro_monthly_sle", value: "50000" },
  });

  await prisma.platformSetting.upsert({
    where: { key: "worker_elite_monthly_sle" },
    update: {},
    create: { key: "worker_elite_monthly_sle", value: "100000" },
  });

  await prisma.platformSetting.upsert({
    where: { key: "client_subscription_monthly_sle" },
    update: {},
    create: { key: "client_subscription_monthly_sle", value: "30000" },
  });

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
