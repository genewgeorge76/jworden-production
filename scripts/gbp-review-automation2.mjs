const mockCustomers = [
  { name: 'John D.', phone: '+18045550101', jobType: 'residential driveway paving', location: 'Midlothian, VA' },
  { name: 'Sarah M.', phone: '+18045550102', jobType: 'commercial parking lot sealcoating', location: 'Richmond, VA' }
];
const gbplink = 'https://g.page/r/YOUR_UNIQUE_ID/review';

function generateReviewSMS(customer) {
  return 'Hi ' + customer.name + ', thanks for choosing J. Worden & Sons for your ' + customer.jobType + ' in ' + customer.location + '! We rely heavily on word-of-mouth. If you have 30 seconds, could you leave us a quick Google review here? ' + gbplink;
}

const mockGBPQuestions = [
  {q: 'Do you offer residential tar and chip driveways in Chesterfield?', a: 'Yes! We specialize in long rural tar and chip driveways throughout Chesterfield County and the surrounding Richmond area. Tar and chip provides excellent traction and a rustic look.'}
];

async function runGBPAutomation() {
  console.log('--- JWS GBP & Review Automation Triggered ---');
  console.log('\n[REVIEWS] Sending post-job SMS request batch...');
  for (const c of mockCustomers) {
    await new Promise(r => setTimeout(r, 600));
    console.log('   -> SMS to ' + c.phone + ' | ' + generateReviewSMS(c));
  }
  console.log('\n[GBP Q&A] Pushing pre-populated SEO questions to Google Business Profile...');
  for (const qa of mockGBPQuestions) {
    await new Promise(r => setTimeout(r, 500));
    console.log('   [Q] ' + qa.q);
    console.log('   [A] ' + qa.a);
    console.log('   [OK] Synced to GBP');
  }
  console.log('\n--- Automation Complete ---');
}
runGBPAutomation();
