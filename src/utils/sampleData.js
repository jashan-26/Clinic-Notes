/**
 * Seed Demo Data for ClinicNotes
 * 3 Doctor Notes (English, Hindi, Hinglish)
 * 3 Doctor-Patient Consultations (English, Hindi, Hinglish)
 */

export const SAMPLE_DOCTOR_NOTES = [
  {
    id: 'note-en-1',
    title: 'Dr. Dictation: Mrs. Smith (Hypertension & Gastritis)',
    language: 'en-IN',
    langLabel: 'English',
    text: `Today I met with a patient. Her name was Mrs. Smith. She was 38 years old female, phone number 9876543210, MRN CN-84920.
She came in presenting with continuous throbbing frontal headaches and acid reflux that worsens after dinner.
Looking at her past medical history, she has had mild essential hypertension for 3 years, and chronic episodic GERD. No known drug allergies.
On examination, BP was 138 over 88, heart rate 76 beats per minute, chest clear on auscultation.
I am prescribing Combiflam 400mg twice daily after meals for 3 days for the headache.
For her stomach, starting Pan 40 once daily in the morning 30 minutes before breakfast for 14 days.
I have ordered a Complete Blood Count CBC, fasting blood glucose, and an Ultrasound whole abdomen.
I advised her to drink at least 2.5 liters of water daily, avoid late-night caffeine, and avoid spicy foods.
Follow up in clinic after 7 days with the lab reports or immediately if headache persists.`,
  },
  {
    id: 'note-hi-1',
    title: 'Dr. Dictation (Hindi): श्री राजेश शर्मा (Fever & Cough)',
    language: 'hi-IN',
    langLabel: 'Hindi (हिंदी)',
    text: `आज मैंने मरीज श्री राजेश शर्मा जी को देखा। उनकी उम्र 45 वर्ष है, मोबाइल नंबर 9812345678, पेशेंट आईडी CN-90123।
मरीज को पिछले चार दिनों से तेज बुखार, बदन दर्द और सूखी खांसी की शिकायत है।
पिछली मेडिकल हिस्ट्री में मरीज को टाइप 2 डायबिटीज और ब्रोंकियल अस्थमा है।
जांच करने पर तापमान 101.2 डिग्री फ़ारेनहाइट था और गले में कंजेस्टिव लालिमा दिखाई दी।
दवाइयों में मैंने Dolo 650 दिन में तीन बार बुखार के लिए और Montair-LC रात को सोते समय 5 दिन के लिए दी है।
इसके अलावा पेट के लिए Pan-D सुबह खाली पेट लेने की सलाह दी गई है।
जांच के लिए Chest X-ray और CBC टेस्ट कराने को कहा है।
मरीज को गुनगुने पानी से गरारे करने और पर्याप्त आराम करने की सलाह दी है। पांच दिन बाद फॉलो-अप के लिए बुलाया है।`,
  },
  {
    id: 'note-hinglish-1',
    title: 'Dr. Dictation (Hinglish): Priya Verma (Allergic Rhinitis)',
    language: 'en-IN',
    langLabel: 'Hinglish',
    text: `Met patient Priya Verma today, 28 years old female, mobile 9898989898, UHID CN-44219.
Chief complaint hai severe sneezing, running nose, and watery eyes since 1 week, specially morning me trigger hota hai.
Medical history shows seasonal allergic rhinitis since childhood, no other chronic illness.
Vitals normal hain, throat examination clear hai, nasal mucosa mildly inflamed.
Prescribed Allegra 120 once daily after dinner for 5 days.
Cough ke liye Ascoril D Plus syrup 10ml twice daily advise kiya.
Asked her to do steam inhalation daily twice and avoid dust exposure or cold beverages.
Routine CBC and allergy IgE profile test order kiya hai.
Follow up after 1 week if symptoms don't resolve.`,
  },
];

export const SAMPLE_CONSULTATIONS = [
  {
    id: 'consult-en-1',
    title: 'Outpatient Consultation: Acute Flu & Headache',
    language: 'en-IN',
    langLabel: 'English',
    dialogue: [
      { speaker: 'Doctor', text: 'Good morning, please have a seat. What brings you in today?' },
      { speaker: 'Patient', text: 'Good morning doctor. I have had a severe throbbing headache and mild fever since yesterday evening.' },
      { speaker: 'Doctor', text: 'I see. Have you noticed any stomach discomfort, acidity, or nausea as well?' },
      { speaker: 'Patient', text: 'Yes, after taking a painkiller on an empty stomach this morning, I had intense burning in my chest and sour burps.' },
      { speaker: 'Doctor', text: 'Understood. Let me check your temperature and vitals. Temperature is 99.8°F, throat is mildly congested.' },
      { speaker: 'Doctor', text: 'I am prescribing Combiflam 400mg twice daily after food for 3 days for the fever and headache.' },
      { speaker: 'Doctor', text: 'To protect your stomach and stop the burning, take Pan 40 once daily in the morning 30 minutes before breakfast for 5 days.' },
      { speaker: 'Patient', text: 'Can I take Combiflam empty stomach if I am in a hurry?' },
      { speaker: 'Doctor', text: 'No, strictly take Combiflam after food or milk, never on an empty stomach. Make sure you drink at least 2.5 to 3 liters of water.' },
      { speaker: 'Patient', text: 'Thank you doctor. Should I come back for a review?' },
      { speaker: 'Doctor', text: 'Yes, review with me after 5 days, or earlier if the fever exceeds 101°F or headache does not subside.' },
    ],
  },
  {
    id: 'consult-hi-1',
    title: 'Consultation (Hindi): पेट दर्द और एसिडिटी (Sunita Kapoor)',
    language: 'hi-IN',
    langLabel: 'Hindi (हिंदी)',
    dialogue: [
      { speaker: 'Doctor', text: 'नमस्ते सुनीता जी, बताइए क्या तकलीफ है?' },
      { speaker: 'Patient', text: 'नमस्ते डॉक्टर साहब। मुझे दो-तीन दिनों से पेट के ऊपरी हिस्से में बहुत तेज जलन और गैस का दर्द हो रहा है।' },
      { speaker: 'Doctor', text: 'क्या आपको उल्टी जैसा महसूस होता है या सिरदर्द भी है?' },
      { speaker: 'Patient', text: 'जी उल्टी जैसा मन रहता है, कुछ खाने का मन नहीं करता और सुबह उठते ही खट्टी डकारें आती हैं।' },
      { speaker: 'Doctor', text: 'मैंने जांच कर ली है। यह एक्यूट गैस्ट्र्रिटिस और हाइपरएसिडिटी के लक्षण हैं।' },
      { speaker: 'Doctor', text: 'मैं आपको Pan-D कैप्सूल लिख रहा हूँ, इसे सुबह नाश्ते से आधा घंटा पहले 7 दिनों तक लेना है।' },
      { speaker: 'Doctor', text: 'साथ ही उल्टी और जी मिचलाने के लिए Ondem 4 जरूरत पड़ने पर एक गोली ले सकती हैं।' },
      { speaker: 'Patient', text: 'डॉक्टर साहब खाने-पीने में क्या परहेज रखना होगा?' },
      { speaker: 'Doctor', text: 'तला-भुना, ज्यादा मिर्च-मसाला और चाय-कॉफी बिल्कुल बंद कर दें। हल्का दलिया या खिचड़ी खाएं और खूब पानी पिएं।' },
      { speaker: 'Doctor', text: 'यदि सात दिनों में आराम न मिले या पेट दर्द बढ़े, तो तुरंत क्लिनिक में दिखाएं।' },
    ],
  },
  {
    id: 'consult-hinglish-1',
    title: 'Consultation (Hinglish): Throat Infection & Dry Cough (Amit Gupta)',
    language: 'en-IN',
    langLabel: 'Hinglish',
    dialogue: [
      { speaker: 'Doctor', text: 'Hello Amit, how are you feeling today?' },
      { speaker: 'Patient', text: 'Doctor sahab, gale me bahut kharash hai aur raat me dry cough ki wajah se so nahi pa raha hoon.' },
      { speaker: 'Doctor', text: 'Kitne din se chal raha hai cough? Any fever or chills?' },
      { speaker: 'Patient', text: 'Last 3 days se hai. Fever nahi hai but heavy body ache aur weakness lag rahi hai.' },
      { speaker: 'Doctor', text: 'Let me inspect your pharynx. There is moderate redness in your tonsils and post-nasal drip.' },
      { speaker: 'Doctor', text: 'I am prescribing Augmentin 625 Duo twice daily after meals for 5 days. It is an antibiotic, so please complete the full 5-day course.' },
      { speaker: 'Doctor', text: 'Night dry cough ke liye Montair-LC bedtime pe ek tablet lijiye for 5 days.' },
      { speaker: 'Doctor', text: 'And body ache ke liye Dolo 650 SOS jab zarurat ho tab le sakte hain.' },
      { speaker: 'Patient', text: 'Doctor, should I do salt water gargles too?' },
      { speaker: 'Doctor', text: 'Yes, warm salt water gargles twice a day will give great relief. Avoid iced drinks.' },
      { speaker: 'Patient', text: 'Thank you doctor, I will follow this schedule.' },
      { speaker: 'Doctor', text: 'Take care. Follow up after 5 days if cough persists.' },
    ],
  },
];
