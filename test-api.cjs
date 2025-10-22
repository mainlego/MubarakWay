// Test script to check API responses in Node.js
const https = require('https');

function testAPI(endpoint, name) {
  return new Promise((resolve, reject) => {
    const url = `https://mubarakway-backend.onrender.com/api/${endpoint}`;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${name}`);
    console.log(`URL: ${url}`);
    console.log('='.repeat(60));

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`\n✅ Status: ${res.statusCode}`);
          console.log(`📊 Response:`);
          console.log(JSON.stringify(json, null, 2));

          if (json.success) {
            console.log(`\n✅ SUCCESS: true`);
            console.log(`📈 Count: ${json.count || json.books?.length || json.nashids?.length || 0}`);

            if (json.books && json.books.length > 0) {
              console.log(`\n📚 First book:`);
              const book = json.books[0];
              console.log(`   - ID: ${book.bookId || 'MISSING!'}`);
              console.log(`   - Title: "${book.title}"`);
              console.log(`   - Author: "${book.author || 'N/A'}"`);
              console.log(`   - Has bookId: ${!!book.bookId ? '✅' : '❌'}`);
            }

            if (json.nashids && json.nashids.length > 0) {
              console.log(`\n🎵 First nashid:`);
              const nashid = json.nashids[0];
              console.log(`   - ID: ${nashid.nashidId || 'MISSING!'}`);
              console.log(`   - Title: "${nashid.title}"`);
              console.log(`   - Artist: "${nashid.artist}"`);
              console.log(`   - Has nashidId: ${!!nashid.nashidId ? '✅' : '❌'}`);
            }
          } else {
            console.log(`\n❌ SUCCESS: false`);
            console.log(`Message: ${json.message}`);
          }

          resolve(json);
        } catch (error) {
          console.error(`\n❌ JSON Parse Error:`, error.message);
          console.log('Raw data:', data.substring(0, 500));
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error(`\n❌ Request Error:`, error.message);
      reject(error);
    });
  });
}

async function runTests() {
  console.log('\n🚀 Starting API Tests...\n');

  try {
    await testAPI('books', 'Books API');
    await testAPI('nashids', 'Nashids API');

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  }
}

runTests();
