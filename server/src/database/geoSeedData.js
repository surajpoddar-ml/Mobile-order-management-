/**
 * Official Indian Administrative Geographical Master Dataset
 * - 28 States
 * - 8 Union Territories
 * - Official District sets for each State / UT
 */

export const INDIAN_STATES_AND_UTS = [
  // 28 States
  { code: 'AP', name: 'Andhra Pradesh', type: 'State', zone: 'South', districts: [
    'Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Prakasam',
    'Srikakulam', 'Sri Potti Sriramulu Nellore', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa'
  ]},
  { code: 'AR', name: 'Arunachal Pradesh', type: 'State', zone: 'North East', districts: [
    'Tawang', 'West Kameng', 'East Kameng', 'Papum Pare', 'Kurung Kumey', 'Kra Daadi',
    'Lower Subansiri', 'Upper Subansiri', 'West Siang', 'East Siang', 'Siang', 'Upper Siang',
    'Lower Siang', 'Lower Dibang Valley', 'Dibang Valley', 'Anjaw', 'Lohit', 'Namsai', 'Changlang', 'Tirap', 'Longding'
  ]},
  { code: 'AS', name: 'Assam', type: 'State', zone: 'North East', districts: [
    'Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 'Darrang',
    'Dhemaji', 'Dhubri', 'Dibrugarh', 'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai', 'Jorhat',
    'Kamrup', 'Kamrup Metropolitan', 'Karbi Anglong', 'Karimganj', 'Kokrajhar', 'Lakhimpur', 'Majuli',
    'Morigaon', 'Nagaon', 'Nalbari', 'Dima Hasao', 'Sivasagar', 'Sonitpur', 'South Salmara-Mankachar',
    'Tinsukia', 'Udalguri', 'West Karbi Anglong'
  ]},
  { code: 'BR', name: 'Bihar', type: 'State', zone: 'East', districts: [
    'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar',
    'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar',
    'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur',
    'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura',
    'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran'
  ]},
  { code: 'CG', name: 'Chhattisgarh', type: 'State', zone: 'Central', districts: [
    'Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur', 'Bilaspur', 'Dantewada',
    'Dhamtari', 'Durg', 'Gariaband', 'Janjgir-Champa', 'Jashpur', 'Kabirdham', 'Kanker', 'Kondagaon',
    'Korba', 'Koriya', 'Mahasamund', 'Mungeli', 'Narayanpur', 'Raigarh', 'Raipur', 'Rajnandgaon', 'Sukma', 'Surajpur', 'Surguja'
  ]},
  { code: 'GA', name: 'Goa', type: 'State', zone: 'West', districts: [
    'North Goa', 'South Goa'
  ]},
  { code: 'GJ', name: 'Gujarat', type: 'State', zone: 'West', districts: [
    'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Botad',
    'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Jamnagar',
    'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal',
    'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad'
  ]},
  { code: 'HR', name: 'Haryana', type: 'State', zone: 'North', districts: [
    'Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hisar', 'Jhajjar',
    'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula',
    'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'
  ]},
  { code: 'HP', name: 'Himachal Pradesh', type: 'State', zone: 'North', districts: [
    'Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu', 'Lahaul and Spiti', 'Mandi',
    'Shimla', 'Sirmaur', 'Solan', 'Una'
  ]},
  { code: 'JH', name: 'Jharkhand', type: 'State', zone: 'East', districts: [
    'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum', 'Garhwa', 'Giridih',
    'Godda', 'Gumla', 'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 'Latehar', 'Lohardaga',
    'Pakur', 'Palamu', 'Ramgarh', 'Ranchi', 'Sahebganj', 'Seraikela Kharsawan', 'Simdega', 'West Singhbhum'
  ]},
  { code: 'KA', name: 'Karnataka', type: 'State', zone: 'South', districts: [
    'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Chamarajanagar',
    'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere', 'Dharwad',
    'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru',
    'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir'
  ]},
  { code: 'KL', name: 'Kerala', type: 'State', zone: 'South', districts: [
    'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode',
    'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
  ]},
  { code: 'MP', name: 'Madhya Pradesh', type: 'State', zone: 'Central', districts: [
    'Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 'Bhind',
    'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori',
    'Guna', 'Gwalior', 'Harda', 'Hoshangabad', 'Indore', 'Jabalpur', 'Jhabua', 'Katni', 'Khandwa',
    'Khargone', 'Mandla', 'Mandsaur', 'Morena', 'Narsinghpur', 'Neemuch', 'Panna', 'Raisen', 'Rajgarh',
    'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 'Seoni', 'Shahdol', 'Shajapur', 'Sheopur', 'Shivpuri',
    'Sidhi', 'Singrauli', 'Tikamgarh', 'Ujjain', 'Umaria', 'Vidisha'
  ]},
  { code: 'MH', name: 'Maharashtra', type: 'State', zone: 'West', districts: [
    'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur',
    'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City',
    'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani',
    'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'
  ]},
  { code: 'MN', name: 'Manipur', type: 'State', zone: 'North East', districts: [
    'Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 'Kakching',
    'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl', 'Senapati', 'Tamenglong', 'Tengnoupal', 'Thoubal', 'Ukhrul'
  ]},
  { code: 'ML', name: 'Meghalaya', type: 'State', zone: 'North East', districts: [
    'East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'North Garo Hills', 'Ri Bhoi',
    'South Garo Hills', 'South West Garo Hills', 'South West Khasi Hills', 'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills'
  ]},
  { code: 'MZ', name: 'Mizoram', type: 'State', zone: 'North East', districts: [
    'Aizawl', 'Champhai', 'Hnahthial', 'Khawzawl', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit', 'Saiha', 'Saitual', 'Serchhip'
  ]},
  { code: 'NL', name: 'Nagaland', type: 'State', zone: 'North East', districts: [
    'Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung', 'Mon', 'Peren', 'Phek', 'Tuensang', 'Wokha', 'Zunheboto'
  ]},
  { code: 'OD', name: 'Odisha', type: 'State', zone: 'East', districts: [
    'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 'Deogarh', 'Dhenkanal',
    'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara',
    'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada',
    'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'
  ]},
  { code: 'PB', name: 'Punjab', type: 'State', zone: 'North', districts: [
    'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur', 'Gurdaspur',
    'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Mansa', 'Moga', 'Muktsar', 'Nawanshahr',
    'Pathankot', 'Patiala', 'Rupnagar', 'Sahibzada Ajit Singh Nagar', 'Sangrur', 'Tarn Taran'
  ]},
  { code: 'RJ', name: 'Rajasthan', type: 'State', zone: 'North', districts: [
    'Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi',
    'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh', 'Jaipur', 'Jaisalmer',
    'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh',
    'Rajsamand', 'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'
  ]},
  { code: 'SK', name: 'Sikkim', type: 'State', zone: 'North East', districts: [
    'East Sikkim', 'North Sikkim', 'South Sikkim', 'West Sikkim'
  ]},
  { code: 'TN', name: 'Tamil Nadu', type: 'State', zone: 'South', districts: [
    'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode',
    'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
    'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet',
    'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
    'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'
  ]},
  { code: 'TS', name: 'Telangana', type: 'State', zone: 'South', districts: [
    'Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally',
    'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Kumuram Bheem Asifabad', 'Mahabubabad',
    'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda',
    'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Ranga Reddy', 'Sangareddy',
    'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal Rural', 'Warangal Urban', 'Yadadri Bhuvanagiri'
  ]},
  { code: 'TR', name: 'Tripura', type: 'State', zone: 'North East', districts: [
    'Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura'
  ]},
  { code: 'UP', name: 'Uttar Pradesh', type: 'State', zone: 'North', districts: [
    'Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Ayodhya', 'Azamgarh', 'Baghpat',
    'Bahraich', 'Ballia', 'Balrampur', 'Banda', 'Barabanki', 'Bareilly', 'Basti', 'Bhadohi', 'Bijnor',
    'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah', 'Etawah', 'Farrukhabad',
    'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar', 'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur',
    'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi', 'Kannauj', 'Kanpur Dehat',
    'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kushinagar', 'Lakhimpur Kheri', 'Lalitpur', 'Lucknow',
    'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 'Meerut', 'Mirzapur', 'Moradabad',
    'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 'Prayagraj', 'Raebareli', 'Rampur', 'Saharanpur',
    'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli', 'Shravasti', 'Siddharthnagar', 'Sitapur',
    'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi'
  ]},
  { code: 'UK', name: 'Uttarakhand', type: 'State', zone: 'North', districts: [
    'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar', 'Nainital', 'Pauri Garhwal',
    'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi'
  ]},
  { code: 'WB', name: 'West Bengal', type: 'State', zone: 'East', districts: [
    'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 'Hooghly',
    'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia',
    'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman', 'Purba Medinipur',
    'Purulia', 'South 24 Parganas', 'Uttar Dinajpur'
  ]},

  // 8 Union Territories
  { code: 'AN', name: 'Andaman and Nicobar Islands', type: 'Union Territory', zone: 'South', districts: [
    'Nicobar', 'North and Middle Andaman', 'South Andaman'
  ]},
  { code: 'CH', name: 'Chandigarh', type: 'Union Territory', zone: 'North', districts: [
    'Chandigarh'
  ]},
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'Union Territory', zone: 'West', districts: [
    'Dadra and Nagar Haveli', 'Daman', 'Diu'
  ]},
  { code: 'DL', name: 'Delhi', type: 'Union Territory', zone: 'North', districts: [
    'Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi',
    'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'
  ]},
  { code: 'JK', name: 'Jammu and Kashmir', type: 'Union Territory', zone: 'North', districts: [
    'Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal', 'Jammu', 'Kathua', 'Kishtwar',
    'Kulgam', 'Kupwara', 'Poonch', 'Pulwama', 'Rajouri', 'Ramban', 'Reasi', 'Samba', 'Shopian', 'Srinagar', 'Udhampur'
  ]},
  { code: 'LA', name: 'Ladakh', type: 'Union Territory', zone: 'North', districts: [
    'Kargil', 'Leh'
  ]},
  { code: 'LD', name: 'Lakshadweep', type: 'Union Territory', zone: 'South', districts: [
    'Lakshadweep'
  ]},
  { code: 'PY', name: 'Puducherry', type: 'Union Territory', zone: 'South', districts: [
    'Karaikal', 'Mahe', 'Puducherry', 'Yanam'
  ]}
];

// Sample core trading areas for top commercial districts
export const SAMPLE_AREAS_BY_DISTRICT = {
  'Mumbai City': ['Fort', 'Nariman Point', 'Colaba', 'Marine Lines', 'Kalbadevi', 'Lamington Road', 'Dadar'],
  'Mumbai Suburban': ['Andheri East', 'Andheri West', 'Bandra West', 'Borivali West', 'Goregaon East', 'Malad West', 'Kurla West', 'Ghatkopar'],
  'Pune': ['Shivajinagar', 'Kothrud', 'Hadapsar', 'Hinjewadi', 'Viman Nagar', 'Swargate', 'Pimpri-Chinchwad'],
  'Thane': ['Thane West', 'Naupada', 'Ghopbunder Road', 'Kalyan', 'Dombivli', 'Bhiwandi', 'Mira Road'],
  'Ahmedabad': ['Ashram Road', 'C.G. Road', 'Navrangpura', 'Satellite', 'Maninagar', 'Bopal', 'Naroda', 'Relief Road'],
  'Surat': ['Ring Road', 'Varachha', 'Adajan', 'Athwa Lines', 'Katargam', 'Majura Gate'],
  'Bengaluru Urban': ['SP Road', 'Chickpet', 'Indiranagar', 'Koramangala', 'Whitefield', 'Jayanagar', 'HSR Layout', 'Malleshwaram'],
  'Chennai': ['Ritchie Street', 'Mount Road', 'T. Nagar', 'Parrys', 'Anna Nagar', 'Velachery', 'Guindy'],
  'Central Delhi': ['Chandni Chowk', 'Karol Bagh (Gaffar Market)', 'Connaught Place', 'Daryaganj'],
  'New Delhi': ['Nehru Place', 'Khan Market', 'Lajpat Nagar', 'Barakhamba Road'],
  'South Delhi': ['Saket', 'Hauz Khas', 'Greater Kailash', 'Malviya Nagar', 'Okhla Industrial Area'],
  'Kolkata': ['Chandni Chowk Market', 'Burrabazar', 'Park Street', 'Salt Lake Sector V', 'Gariahat', 'Bhowanipore'],
  'Hyderabad': ['Jagdish Market (Abids)', 'Ameerpet', 'Koti', 'Secunderabad', 'Madhapur', 'Banjara Hills', 'Dilsukhnagar'],
  'Jaipur': ['Raisar Plaza (Indira Bazar)', 'MI Road', 'Johari Bazar', 'Mansarovar', 'Vaishali Nagar'],
  'Lucknow': ['Naza Market (Hazratganj)', 'Aminabad', 'Alambagh', 'Gomti Nagar', 'Indira Nagar'],
  'Patna': ['Bakarganj', 'Dak Bunglow Road', 'Kankarbagh', 'Boring Road', 'Fraser Road'],
  'Indore': ['Silver Sanctuary Market (Jail Road)', 'Rajwada', 'Vijay Nagar', 'Palasia', 'Chhavani']
};

