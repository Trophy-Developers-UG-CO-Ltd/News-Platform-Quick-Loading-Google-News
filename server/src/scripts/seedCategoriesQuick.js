const axios = require('axios');

const categories = [
  'News',
  'Entertainment',
  'Politics',
  'Lifestyle',
  'Videos',
  'Trending',
  'Politics Update',
  'Celebrity News',
  'Jobs Released',
  'Campus Trends',
  'Business Stories',
  'City News',
  'Sports',
];

const API = 'http://localhost:5000/api/categories';

(async () => {
  for (const name of categories) {
    try {
      const res = await axios.post(API, { name });
      console.log('Created:', res.data.name);
    } catch (e) {
      if (e.response && e.response.status === 400) {
        console.log('Exists:', name);
      } else {
        console.error('Error:', name, e.message);
      }
    }
  }
})();
