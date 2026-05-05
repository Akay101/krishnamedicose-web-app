const app = require('./src/app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  family: 4 // Force IPv4 to resolve DNS querySrv issues
})
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });
