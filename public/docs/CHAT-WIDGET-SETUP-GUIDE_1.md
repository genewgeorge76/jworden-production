# 🤖 AI CHAT WIDGET - INSTALLATION & SETUP GUIDE

J. Worden & Sons AI Chat Widget with Lead Capture & Gmail Integration

---

## 📦 WHAT'S INCLUDED

1. **ChatWidget.jsx** — React component (AI-powered chat with Claude)
2. **chat-lead-capture.js** — Netlify serverless function (receives leads, sends emails)
3. **This guide** — Setup instructions

---

## ✅ STEP 1: ADD REACT & DEPENDENCIES

Your site needs React. If you're using a static site generator or plain HTML, skip to **Step 2 (Alternative)**.

If you're building this as a React app:

```bash
npm install nodemailer
```

---

## 🔄 STEP 2: ADD THE NETLIFY FUNCTION

### Create the function folder structure:

In your GitHub repo, create:
```
netlify/
└── functions/
    └── chat-lead-capture.js
```

Copy the content of `chat-lead-capture.js` into this file.

**Note:** Netlify automatically detects functions in the `netlify/functions/` directory.

---

## 📧 STEP 3: CONFIGURE GMAIL APP PASSWORD

Your Netlify function sends emails via Gmail. You need to set up an App Password (not your regular Gmail password).

### 3a. Enable 2-Factor Authentication on Gmail (if not already enabled)

1. Go to: **https://myaccount.google.com**
2. Click **Security** (left sidebar)
3. Under "How you sign in to Google," enable **2-Step Verification**

### 3b. Create App Password

1. Go to: **https://myaccount.google.com/apppasswords**
2. Select: **Mail** & **Windows Computer** (doesn't matter which device)
3. Google generates a 16-character password
4. **Copy this password** (you'll need it next)

---

## 🔐 STEP 4: SET NETLIFY ENVIRONMENT VARIABLES

1. Go to **https://app.netlify.com** (log into your site)
2. Click **Site settings** → **Build & deploy** → **Environment**
3. Click **Edit variables**

Add these 3 environment variables:

### Variable 1: Gmail User Email
```
GMAIL_USER = your-email@gmail.com
```
(Use the Gmail account that will send the emails)

### Variable 2: Gmail App Password
```
GMAIL_APP_PASSWORD = xxxx xxxx xxxx xxxx
```
(Paste the 16-character password from Step 3b)

### Variable 3: Recipients (Your Owner Emails)
```
GMAIL_RECIPIENTS = jhworden1@gmail.com,genewgeorge@gmail.com
```
(Comma-separated list of emails that receive lead notifications)

**Save these variables.** Netlify redeploys automatically.

---

## 🎨 STEP 5: ADD THE CHAT WIDGET TO YOUR SITE

### Option A: If your site is a React app

1. **Copy `ChatWidget.jsx`** into your project:
   ```
   src/components/ChatWidget.jsx
   ```

2. **Import it in your main page** (e.g., `index.jsx` or `App.jsx`):
   ```javascript
   import ChatWidget from './components/ChatWidget';
   
   export default function Home() {
     return (
       <div>
         {/* Your page content */}
         <ChatWidget />
       </div>
     );
   }
   ```

3. **Deploy** — GitHub → Netlify auto-deploys

### Option B: If your site is static HTML/JavaScript

I can create a **standalone HTML version** that loads as an iframe or script tag. Let me know, and I'll build this.

---

## 🧪 STEP 6: TEST THE WIDGET

1. Deploy your site (via GitHub push to Netlify)
2. Go to your live site: **https://jwordenasphaltpaving.com**
3. Look for the **yellow chat bubble** in the bottom-right corner
4. Click it and start chatting
5. Complete the lead capture form
6. Check your email inbox for the lead notification

**You should receive:**
- ✅ Owner notification email (formatted lead data)
- ✅ Customer auto-reply (thanking them for reaching out)

---

## 🎯 WHAT THE WIDGET DOES

### Visitor Experience
1. Opens as a floating chat bubble (💬 icon)
2. AI answers questions about your services
3. Collects: Name, Phone, Email, Service, Project Details, Timing
4. Provides instant cost estimates
5. Sends confirmation: "Your info has been sent. We'll contact you within 24 hours."

### Your Experience (Email Notifications)
You receive an email with:
- Customer name, phone, email
- Service they're interested in
- Project details
- When they want to start
- Clickable phone link to call them immediately

---

## 🛠️ CUSTOMIZATION

### Change Colors (Navy & Gold)
In **ChatWidget.jsx**, find these color values and edit:
```javascript
'#1c3a47' // Navy (header, buttons)
'#f59e0b' // Gold (accent, CTA button)
```

### Change Chat Greeting
Line ~20 in `ChatWidget.jsx`:
```javascript
text: "Hi! 👋 I'm the J. Worden & Sons AI assistant. How can I help you today?"
```

### Add More Services
In `ChatWidget.jsx`, update the `services` array (line ~70):
```javascript
const services = [
  'Asphalt Driveway Paving',
  'Parking Lot Paving',
  'Your new service here',
  // ...
];
```

### Update Cost Estimates
Update `costEstimates` object (line ~85) with your current pricing.

---

## 🚨 TROUBLESHOOTING

### Widget appears but doesn't send emails
- ✅ Check Netlify function logs: **Site settings** → **Functions** → **chat-lead-capture**
- ✅ Verify environment variables are set correctly
- ✅ Confirm Gmail App Password is correct (16 chars, not your regular password)
- ✅ Confirm 2-Factor Authentication is enabled on Gmail

### Claude API not responding
- ✅ Netlify functions can access the Claude API
- ✅ Check that `https://api.anthropic.com/v1/messages` is reachable
- ✅ No API key needed — Netlify functions don't expose client-side keys

### Emails not arriving
- ✅ Check spam/promotions folder
- ✅ Verify `GMAIL_RECIPIENTS` environment variable is correct
- ✅ Test with a different email address in `GMAIL_RECIPIENTS`

---

## 📊 MONITORING LEADS

1. **Email:** Leads arrive in your inbox automatically
2. **Netlify logs:** View chat function activity in Netlify dashboard
3. **Contact them:** Each lead email includes clickable phone links

---

## 🚀 NEXT STEPS

1. ✅ Upload `ChatWidget.jsx` and function to GitHub
2. ✅ Set Netlify environment variables
3. ✅ Test the widget on your live site
4. ✅ Start capturing leads!

---

## 💡 TIPS FOR SUCCESS

- **Respond quickly:** Chat leads expect fast follow-up (same day)
- **Personalize:** Use customer name from lead email in your response
- **Call them:** Phone is more effective than email for service businesses
- **Track:** Note the chat source in your CRM so you can measure ROI

---

## 📞 SUPPORT

If you run into issues:
1. Check Netlify function logs (Netlify dashboard → Functions)
2. Verify environment variables (Site settings → Environment)
3. Test the function directly: `/.netlify/functions/chat-lead-capture`
4. Call (804) 446-1296 or email support

---

**Your AI Chat Widget is now ready to capture leads 24/7!** 🎉
