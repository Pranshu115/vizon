const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Seed trucks - matching the browse page dummy data
  const trucks = [
    {
      id: 1,
      name: 'Tata Prima',
      manufacturer: 'Tata Motors',
      model: 'Prima',
      year: 2023,
      kilometers: 15000,
      horsepower: 380,
      price: '800000',
      imageUrl: '/Gemini_Generated_Image_189xp8189xp8189x.png',
      subtitle: 'Premium heavy-duty truck with advanced features.',
      certified: true
    },
    {
      id: 2,
      name: 'Tata Signa',
      manufacturer: 'Tata Motors',
      model: 'Signa',
      year: 2022,
      kilometers: 22000,
      horsepower: 350,
      price: '800000',
      imageUrl: '/Gemini_Generated_Image_6gr84a6gr84a6gr8.png',
      subtitle: 'Powerful and fuel-efficient tipper truck.',
      certified: true
    },
    {
      id: 3,
      name: 'Ashok Leyland 2820',
      manufacturer: 'Ashok Leyland',
      model: '2820',
      year: 2021,
      kilometers: 35000,
      horsepower: 200,
      price: '780000',
      imageUrl: '/Gemini_Generated_Image_6q2b966q2b966q2b-2.png',
      subtitle: 'Reliable and durable for long hauls.',
      certified: false
    },
    {
      id: 4,
      name: 'BharatBenz 1617R',
      manufacturer: 'BharatBenz',
      model: '1617R',
      year: 2023,
      kilometers: 18000,
      horsepower: 170,
      price: '790000',
      imageUrl: '/Gemini_Generated_Image_6q2b966q2b966q2b-3.png',
      subtitle: 'German engineering for Indian roads.',
      certified: true
    },
    {
      id: 5,
      name: 'Mahindra Bolero Pik-Up',
      manufacturer: 'Mahindra',
      model: 'Bolero Pik-Up',
      year: 2022,
      kilometers: 12000,
      horsepower: 75,
      price: '640000',
      imageUrl: '/Gemini_Generated_Image_6q2b966q2b966q2b.png',
      subtitle: 'Perfect for last-mile delivery.',
      certified: true
    },
    {
      id: 6,
      name: 'Mahindra Bolero Camper',
      manufacturer: 'Mahindra',
      model: 'Bolero Camper',
      year: 2023,
      kilometers: 8000,
      horsepower: 80,
      price: '650000',
      imageUrl: '/Gemini_Generated_Image_ex5b2aex5b2aex5b.png',
      subtitle: 'Versatile pickup for all terrains.',
      certified: true
    },
    {
      id: 7,
      name: 'Mahindra Pickup',
      manufacturer: 'Mahindra',
      model: 'Pickup',
      year: 2020,
      kilometers: 45000,
      horsepower: 70,
      price: '500000',
      imageUrl: '/Gemini_Generated_Image_azvzznazvzznazvz.png',
      subtitle: 'Economical and robust.',
      certified: false
    },
    {
      id: 8,
      name: 'Eicher Pro 6025T',
      manufacturer: 'Eicher Motors',
      model: 'Pro 6025T',
      year: 2022,
      kilometers: 32000,
      horsepower: 250,
      price: '750000',
      imageUrl: '/Gemini_Generated_Image_f5675rf5675rf567.png',
      subtitle: 'High payload capacity truck.',
      certified: true
    },
    {
      id: 9,
      name: 'Force Urbania',
      manufacturer: 'Force Motors',
      model: 'Urbania',
      year: 2021,
      kilometers: 25000,
      horsepower: 115,
      price: '800000',
      imageUrl: '/Gemini_Generated_Image_o2qgpno2qgpno2qg.png',
      subtitle: 'Premium passenger and cargo vehicle.',
      certified: false
    },
    {
      id: 10,
      name: 'Isuzu D-MAX',
      manufacturer: 'Isuzu',
      model: 'D-MAX',
      year: 2023,
      kilometers: 10000,
      horsepower: 150,
      price: '740000',
      imageUrl: '/Gemini_Generated_Image_tywt8qtywt8qtywt.png',
      subtitle: 'Japanese quality pickup truck.',
      certified: true
    },
    {
      id: 11,
      name: 'Tata LPT 1613',
      manufacturer: 'Tata Motors',
      model: 'LPT 1613',
      year: 2022,
      kilometers: 20000,
      horsepower: 130,
      price: '760000',
      imageUrl: '/Gemini_Generated_Image_wyesgowyesgowyes.png',
      subtitle: 'Versatile medium duty truck.',
      certified: true
    },
    {
      id: 12,
      name: 'SML Isuzu S7',
      manufacturer: 'SML Isuzu',
      model: 'S7',
      year: 2021,
      kilometers: 12000,
      horsepower: 92,
      price: '800000',
      imageUrl: '/Gemini_Generated_Image_6q2b966q2b966q2b.png',
      subtitle: 'Heavy-duty tipper for mining.',
      certified: false
    }
  ]

  // Clear existing trucks and reseed
  await prisma.truck.deleteMany()
  
  for (const truck of trucks) {
    await prisma.truck.create({
      data: {
        name: truck.name,
        manufacturer: truck.manufacturer,
        model: truck.model,
        year: truck.year,
        kilometers: truck.kilometers,
        horsepower: truck.horsepower,
        price: parseFloat(truck.price),
        imageUrl: truck.imageUrl,
        subtitle: truck.subtitle,
        certified: truck.certified
      }
    })
  }

  console.log('✅ Database seeded successfully with', trucks.length, 'trucks')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
