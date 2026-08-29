import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Incident from '../models/Incident.js';

dotenv.config();

const checkIncidents = async () => {
  try {
    await connectDB();
    console.log('Connected to database');
    
    const totalIncidents = await Incident.countDocuments();
    console.log(`Total incidents in database: ${totalIncidents}`);
    
    if (totalIncidents > 0) {
      const incidents = await Incident.find().limit(5);
      console.log('\nFirst 5 incidents:');
      incidents.forEach((incident, index) => {
        console.log(`${index + 1}. ${incident.title} - Status: ${incident.status}`);
      });
      
      const statusCounts = await Incident.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      console.log('\nIncidents by status:');
      statusCounts.forEach(item => {
        console.log(`  ${item._id}: ${item.count}`);
      });
    } else {
      console.log('\nNo incidents found in the database.');
      console.log('You may need to create some test incidents.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkIncidents();
