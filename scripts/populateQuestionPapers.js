const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function populatePapers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ptu_nexus'
  });

  // ✅ STEP 1: Clear existing data to avoid duplicates
  await connection.query('DELETE FROM question_papers');
  await connection.query('ALTER TABLE question_papers AUTO_INCREMENT = 1');
  console.log('🗑️  Cleared existing question papers\n');

  const basePath = path.join(__dirname, '../uploads/question-papers');

  // ✅ STEP 2: Define all courses with correct folder names
  const courses = [
    { folder: 'btech-cse',        semesters: 8 },
    { folder: 'btech-civil',      semesters: 8 },
    { folder: 'btech-mechanical', semesters: 8 },
    { folder: 'btech-electrical', semesters: 8 },
    { folder: 'btech-ece',        semesters: 8 },
    { folder: 'btech-it',         semesters: 8 },
    { folder: 'bba',              semesters: 6 },
    { folder: 'bca',              semesters: 6 },
    { folder: 'mba',              semesters: 4 },
    { folder: 'mca',              semesters: 6 },
  ];

  let totalAdded = 0;

  for (const course of courses) {
    const coursePath = path.join(basePath, course.folder);

    if (!fs.existsSync(coursePath)) {
      console.log(`⚠️  Folder not found, skipping: ${course.folder}`);
      continue;
    }

    console.log(`\n📂 Processing: ${course.folder}`);

    for (let sem = 1; sem <= course.semesters; sem++) {
      const semFolder = `semester-${sem}`;
      const semPath = path.join(coursePath, semFolder);

      if (!fs.existsSync(semPath)) {
        continue; // silently skip missing semester folders
      }

      const files = fs.readdirSync(semPath).filter(f => f.endsWith('.pdf'));

      if (files.length === 0) {
        console.log(`   ⏭️  semester-${sem}: no PDFs`);
        continue;
      }

      for (const file of files) {
        try {
          const filePath = path.join(semPath, file);
          const stats = fs.statSync(filePath);

          // Clean up title from filename
          const title = file
            .replace('.pdf', '')
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .trim();

          // Extract year from filename (e.g. 2023, 2020)
          const yearMatch = file.match(/\b(20\d{2})\b/);
          const year = yearMatch ? yearMatch[1] : '2024';

          // ✅ CRITICAL: store the correct course and semester
          const relativePath = `${course.folder}/${semFolder}/${file}`;

          await connection.query(
            `INSERT INTO question_papers (title, course, semester, year, file_path, file_size, download_count)
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [title, course.folder, semFolder, year, relativePath, stats.size]
          );

          console.log(`   ✅ [${course.folder} | sem-${sem}] ${title}`);
          totalAdded++;
        } catch (error) {
          console.error(`   ❌ Error adding ${file}:`, error.message);
        }
      }
    }
  }

  const [result] = await connection.query('SELECT COUNT(*) as count FROM question_papers');
  console.log(`\n🎉 Done! Total papers in database: ${result[0].count}`);

  // ✅ STEP 3: Show breakdown by course so you can verify
  const [breakdown] = await connection.query(
    'SELECT course, semester, COUNT(*) as count FROM question_papers GROUP BY course, semester ORDER BY course, semester'
  );
  console.log('\n📊 Breakdown by course & semester:');
  breakdown.forEach(row => {
    console.log(`   ${row.course} / ${row.semester}: ${row.count} papers`);
  });

  await connection.end();
  process.exit(0);
}

populatePapers().catch(console.error);