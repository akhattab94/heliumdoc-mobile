import { drizzle } from "drizzle-orm/mysql2";
import { specialties, hospitals, doctors, loyaltyTiers, rewards, doctorSchedules } from "../drizzle/schema";

const scrapedData = {
  specialties: [
    { name: "General Practitioners (GP)", icon: "stethoscope" },
    { name: "Internal Medicine", icon: "heart" },
    { name: "Pediatricians", icon: "child" },
    { name: "Obstetricians & Gynecologists", icon: "female" },
    { name: "General Dentists", icon: "tooth" },
    { name: "Orthopedic Surgeons", icon: "bone" },
    { name: "Urologists", icon: "kidney" },
    { name: "Eye Doctors", icon: "eye" },
    { name: "Ear, Nose & Throat (ENT)", icon: "ear" },
    { name: "Endocrinologist", icon: "diabetes" },
    { name: "Dermatologists", icon: "skin" },
    { name: "Plastic Surgeons", icon: "surgery" },
    { name: "Psychiatrists", icon: "brain" },
    { name: "Orthodontists", icon: "braces" },
    { name: "Cardiologist", icon: "heart-pulse" },
    { name: "Neurologist", icon: "brain" },
    { name: "Nephrologist", icon: "kidney" },
    { name: "Rheumatologist", icon: "joints" },
    { name: "Physiotherapist", icon: "physical-therapy" },
    { name: "Speech Therapist", icon: "speech" },
    { name: "Vascular Surgeon", icon: "blood-vessel" },
    { name: "Audiologist", icon: "hearing" },
    { name: "Periodontist", icon: "gums" },
    { name: "Physical Medicine and Rehabilitation", icon: "rehab" },
    { name: "Osteopath", icon: "spine" },
    { name: "Hand Surgeon", icon: "hand" },
    { name: "Endodontist", icon: "root-canal" }
  ],
  hospitals: [
    { name: "Yasmed Medical Center", area: "Madinat Khalifa South", city: "Doha" },
    { name: "Sidra Medicine", area: "Gharrafat Al Rayyan", city: "Doha" },
    { name: "Nova Healthcare", area: "Al Maamoura", city: "Doha" },
    { name: "Wise Medical Center", area: "Al Nasr", city: "Doha" },
    { name: "Royal Medical Center", area: "Al Gharafa", city: "Doha" },
    { name: "Royal Medical Center Lusail", area: "Lusail", city: "Doha" },
    { name: "KIMSHEALTH Medical Center", area: "Mesaimeer", city: "Doha" },
    { name: "KIMSHEALTH Medical Center Mashaf", area: "Al Meshaf", city: "Doha" },
    { name: "West Bay Medicare", area: "Westbay", city: "Doha" },
    { name: "Naseem Medical Centre", area: "Al Wakrah", city: "Doha" },
    { name: "Dr. Yasser Clinics", area: "Lusail", city: "Doha" },
    { name: "Quttainah Medical Center", area: "Madinat Khalifa South", city: "Doha" },
    { name: "Khalifa Medical Surgery Complex", area: "Al Waab", city: "Doha" },
    { name: "Al-Ahli Hospital", area: "Bin Omran", city: "Doha" },
    { name: "Al Emadi Hospital Al Hilal", area: "Al Hilal", city: "Doha" },
    { name: "Platinum Medical Center Lusail", area: "Lusail", city: "Doha" },
    { name: "DOC Medical Center Lusail", area: "Lusail", city: "Doha" },
    { name: "First Dental Center Al Nuaija", area: "Nuaija", city: "Doha" }
  ],
  doctors: [
    { name: "Dr. Yasser Abbass", specialty: "Urologists", hospital: "Dr. Yasser Clinics", price: 500, languages: ["Arabic", "English"], videoConsult: false, experience: 15, rating: 48 },
    { name: "Dr. Fadi Hayek", specialty: "Vascular Surgeon", hospital: "Royal Medical Center Lusail", price: 500, languages: ["Arabic", "English", "French"], videoConsult: false, experience: 12, rating: 46 },
    { name: "Dr. Adel Qutainah", specialty: "Plastic Surgeons", hospital: "Quttainah Medical Center", price: 500, languages: ["Arabic", "English"], videoConsult: false, experience: 20, rating: 49 },
    { name: "Dr. Nandhini Karthick", specialty: "Psychiatrists", hospital: "Yasmed Medical Center", price: 250, languages: ["English", "Malayalam", "Tamil"], videoConsult: false, experience: 8, rating: 45 },
    { name: "Dr. Samer Al Deeb", specialty: "Orthopedic Surgeons", hospital: "Khalifa Medical Surgery Complex", price: 250, languages: ["Arabic", "English"], videoConsult: false, experience: 14, rating: 47 },
    { name: "Prof. Dr. Abdulrahman Al Masri", specialty: "Endocrinologist", hospital: "Dr. Yasser Clinics", price: 350, languages: ["Arabic", "English"], videoConsult: false, experience: 25, rating: 50 },
    { name: "Dr. Yasmeen Abdul Jalil", specialty: "Obstetricians & Gynecologists", hospital: "Yasmed Medical Center", price: 70, languages: ["English", "Hindi", "Pashto", "Urdu"], videoConsult: false, experience: 10, rating: 48 },
    { name: "Mr. Azaz Swais", specialty: "Physiotherapist", hospital: "Al-Ahli Hospital", price: 350, languages: ["Arabic", "English", "Persian"], videoConsult: false, experience: 7, rating: 44 },
    { name: "Dr. Ahmed Al Dabbagh", specialty: "Nephrologist", hospital: "Al-Ahli Hospital", price: 400, languages: ["Arabic", "English"], videoConsult: false, experience: 16, rating: 47 },
    { name: "Dr. Yasser Nafie", specialty: "Audiologist", hospital: "Al Emadi Hospital Al Hilal", price: 500, languages: ["Arabic", "English"], videoConsult: false, experience: 11, rating: 45 },
    { name: "Dr. Kamel Remita", specialty: "Rheumatologist", hospital: "Al Emadi Hospital Al Hilal", price: 500, languages: ["Arabic", "English", "French"], videoConsult: false, experience: 13, rating: 46 },
    { name: "Dr. Wesam Azar", specialty: "Periodontist", hospital: "Al Emadi Hospital Al Hilal", price: 500, languages: ["Arabic", "English"], videoConsult: false, experience: 9, rating: 44 },
    { name: "Dr. Wissem Soumia Haddad", specialty: "Physical Medicine and Rehabilitation", hospital: "Al Emadi Hospital Al Hilal", price: 500, languages: ["Arabic", "English", "French"], videoConsult: false, experience: 12, rating: 45 },
    { name: "Dr. Nadine Homoud", specialty: "Orthodontists", hospital: "Platinum Medical Center Lusail", price: 200, languages: ["Arabic", "English"], videoConsult: false, experience: 8, rating: 47 },
    { name: "Dr. Hayman Saddik", specialty: "Osteopath", hospital: "DOC Medical Center Lusail", price: 850, languages: ["Arabic", "English", "French"], videoConsult: false, experience: 15, rating: 48 },
    { name: "Dr. Jery Antony", specialty: "Psychiatrists", hospital: "KIMSHEALTH Medical Center Mashaf", price: 150, languages: ["English", "Hindi", "Malayalam", "Tamil"], videoConsult: false, experience: 6, rating: 43 },
    { name: "Dr. Walid Maya", specialty: "Ear, Nose & Throat (ENT)", hospital: "Khalifa Medical Surgery Complex", price: 300, languages: ["Arabic", "English", "French"], videoConsult: false, experience: 14, rating: 46 },
    { name: "Dr. Samuli Aspinen", specialty: "Hand Surgeon", hospital: "DOC Medical Center Lusail", price: 500, languages: ["English", "Finnish"], videoConsult: false, experience: 10, rating: 45 },
    { name: "Dr. Doaa Hassouna", specialty: "Speech Therapist", hospital: "Al Emadi Hospital Al Hilal", price: 500, languages: ["Arabic", "English"], videoConsult: false, experience: 8, rating: 44 },
    { name: "Dr. Alauldin Alsadiq Altayib", specialty: "Endodontist", hospital: "First Dental Center Al Nuaija", price: 200, languages: ["Arabic", "English"], videoConsult: false, experience: 11, rating: 45 },
    { name: "Dr. Johnny Awwad", specialty: "Obstetricians & Gynecologists", hospital: "Sidra Medicine", price: 600, languages: ["Arabic", "English", "French"], videoConsult: true, experience: 18, rating: 49 },
    { name: "Dr. Reeno Barg", specialty: "Obstetricians & Gynecologists", hospital: "Nova Healthcare", price: 30, languages: ["English", "Hindi", "Pashto", "Urdu"], videoConsult: true, experience: 7, rating: 43 },
    { name: "Dr. Seba Zuher Hammadeh", specialty: "Obstetricians & Gynecologists", hospital: "Wise Medical Center", price: 300, languages: ["Arabic", "English"], videoConsult: false, experience: 12, rating: 47 }
  ],
  loyaltyTiers: [
    { name: "Bronze", minPoints: 0, maxPoints: 999, pointsMultiplier: 100, color: "#CD7F32", benefits: '["5% discount on consultations","Priority booking"]' },
    { name: "Silver", minPoints: 1000, maxPoints: 4999, pointsMultiplier: 125, color: "#C0C0C0", benefits: '["10% discount on consultations","Priority booking","Free health checkup annually"]' },
    { name: "Gold", minPoints: 5000, maxPoints: 14999, pointsMultiplier: 150, color: "#FFD700", benefits: '["15% discount on consultations","VIP booking","Free health checkup bi-annually","Complimentary video consultations"]' },
    { name: "Platinum", minPoints: 15000, maxPoints: 999999, pointsMultiplier: 200, color: "#E5E4E2", benefits: '["20% discount on consultations","VIP concierge service","Quarterly health checkups","Unlimited video consultations","Airport lounge access"]' }
  ],
  rewards: [
    { name: "Free Consultation", description: "Redeem for a free doctor consultation", pointsCost: 500, category: "consultation", icon: "stethoscope" },
    { name: "Lab Test Discount", description: "50% off on any lab test", pointsCost: 300, category: "discount", icon: "flask" },
    { name: "Pharmacy Voucher", description: "QAR 50 pharmacy voucher", pointsCost: 400, category: "voucher", icon: "pill" },
    { name: "Video Consultation", description: "Free video consultation with any doctor", pointsCost: 350, category: "consultation", icon: "video" },
    { name: "Health Checkup", description: "Basic health checkup package", pointsCost: 1000, category: "checkup", icon: "heart" },
    { name: "Dental Cleaning", description: "Free dental cleaning session", pointsCost: 600, category: "dental", icon: "tooth" }
  ]
};

async function seedDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);
  console.log("Seeding database with HeliumDoc data...");

  // Seed specialties
  console.log("Inserting specialties...");
  const specialtyMap = new Map<string, number>();
  for (const spec of scrapedData.specialties) {
    try {
      const result = await db.insert(specialties).values({
        name: spec.name,
        icon: spec.icon,
        isActive: true
      });
      specialtyMap.set(spec.name, Number(result[0].insertId));
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log(`Specialty ${spec.name} already exists, skipping...`);
      } else {
        console.error(`Error inserting specialty ${spec.name}:`, e.message);
      }
    }
  }
  console.log(`Processed ${scrapedData.specialties.length} specialties`);

  // Seed hospitals
  console.log("Inserting hospitals...");
  const hospitalMap = new Map<string, number>();
  for (const hosp of scrapedData.hospitals) {
    try {
      const result = await db.insert(hospitals).values({
        name: hosp.name,
        address: `${hosp.area}, ${hosp.city}, Qatar`,
        city: hosp.city,
        isActive: true
      });
      hospitalMap.set(hosp.name, Number(result[0].insertId));
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log(`Hospital ${hosp.name} already exists, skipping...`);
      } else {
        console.error(`Error inserting hospital ${hosp.name}:`, e.message);
      }
    }
  }
  console.log(`Processed ${scrapedData.hospitals.length} hospitals`);

  // Get specialty and hospital IDs from database
  const allSpecialties = await db.select().from(specialties);
  const allHospitals = await db.select().from(hospitals);
  
  for (const s of allSpecialties) {
    specialtyMap.set(s.name, s.id);
  }
  for (const h of allHospitals) {
    hospitalMap.set(h.name, h.id);
  }

  console.log(`Found ${specialtyMap.size} specialties and ${hospitalMap.size} hospitals in database`);

  // Seed doctors
  console.log("Inserting doctors...");
  let doctorCount = 0;
  for (const doc of scrapedData.doctors) {
    const hospitalId = hospitalMap.get(doc.hospital);
    const specialtyId = specialtyMap.get(doc.specialty);
    
    if (!hospitalId || !specialtyId) {
      console.log(`Skipping ${doc.name}: hospital (${doc.hospital}) or specialty (${doc.specialty}) not found`);
      continue;
    }

    try {
      const result = await db.insert(doctors).values({
        name: doc.name,
        hospitalId,
        specialtyId,
        consultationFee: doc.price,
        videoConsultationFee: doc.videoConsult ? doc.price : null,
        videoConsultEnabled: doc.videoConsult,
        languages: JSON.stringify(doc.languages),
        experience: doc.experience,
        rating: doc.rating,
        totalReviews: Math.floor(Math.random() * 200) + 20,
        totalPatients: Math.floor(Math.random() * 1000) + 100,
        isActive: true,
        isVerified: true
      });

      // Add schedule for each doctor (Mon-Fri, 9am-5pm)
      const doctorId = Number(result[0].insertId);
      for (let day = 1; day <= 5; day++) {
        await db.insert(doctorSchedules).values({
          doctorId,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 30,
          isActive: true
        });
      }
      doctorCount++;
      console.log(`Inserted ${doc.name}`);
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log(`Doctor ${doc.name} already exists, skipping...`);
      } else {
        console.error(`Error inserting doctor ${doc.name}:`, e.message);
      }
    }
  }
  console.log(`Inserted ${doctorCount} doctors with schedules`);

  // Seed loyalty tiers
  console.log("Inserting loyalty tiers...");
  for (const tier of scrapedData.loyaltyTiers) {
    try {
      await db.insert(loyaltyTiers).values({
        name: tier.name,
        minPoints: tier.minPoints,
        maxPoints: tier.maxPoints,
        pointsMultiplier: tier.pointsMultiplier,
        color: tier.color,
        benefits: tier.benefits,
        isActive: true
      });
      console.log(`Inserted tier: ${tier.name}`);
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log(`Tier ${tier.name} already exists, skipping...`);
      } else {
        console.error(`Error inserting tier ${tier.name}:`, e.message);
      }
    }
  }

  // Seed rewards
  console.log("Inserting rewards...");
  for (const reward of scrapedData.rewards) {
    try {
      await db.insert(rewards).values({
        name: reward.name,
        description: reward.description,
        pointsCost: reward.pointsCost,
        category: reward.category,
        icon: reward.icon,
        validDays: 30,
        isActive: true
      });
      console.log(`Inserted reward: ${reward.name}`);
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log(`Reward ${reward.name} already exists, skipping...`);
      } else {
        console.error(`Error inserting reward ${reward.name}:`, e.message);
      }
    }
  }

  console.log("\nDatabase seeding complete!");
  process.exit(0);
}

seedDatabase().catch((e) => {
  console.error("Seeding failed:", e);
  process.exit(1);
});
