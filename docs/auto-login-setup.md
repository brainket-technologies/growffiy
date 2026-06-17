# Zerodha Kite Auto-Login & Daily Scheduler Documentation

यह दस्तावेज़ Zerodha Kite ऑटो-लॉगिन इंजन, दैनिक टोकन रिफ्रेश शेड्यूलर, होस्टिंगर डिप्लॉयमेंट सेटिंग्स और उनके परीक्षण (Testing) की पूरी जानकारी देता है।

---

## 1. सिस्टम की विशेषताएँ (Features)
* **ऑटो-लॉगिन (TOTP Based)**: यदि किसी क्लाइंट का एक्सेस टोकन एक्सपायर हो जाता है, तो इंजन बैकग्राउंड में ही क्रेडेंशियल्स और TOTP Secret का उपयोग करके ऑटो-लॉगिन कर लेता है।
* **डेली शेड्यूलर (08:00 AM IST)**: रोज़ाना सुबह ठीक 08:00 बजे (भारतीय समयानुसार) सभी एक्टिव क्लाइंट्स के टोकन को बैकग्राउंड में ऑटो-रिफ्रेश किया जाता है ताकि 09:15 AM पर ट्रेडिंग शुरू होने से पहले नया टोकन तैयार रहे।
* **सुरक्षित एनवायरनमेंट चेक**: ऑटो-लॉगिन की पूरी प्रक्रिया तभी काम करती है जब `KITE_AUTO_LOGIN_ENABLED="true"` सेट हो।

---

## 2. होस्टिंगर एनवायरनमेंट वेरिएबल्स (Environment Variables)
होस्टिंगर के **Environment variables** सेक्शन में नीचे दी गई सेटिंग्स का होना आवश्यक है:

| Variable Name (Key) | Description | Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon Serverless PostgreSQL Connection String | `postgresql://neondb_owner:npg_Qtok2RmWK4uT@ep-purple-frost-aimotyfv-pooler...` |
| `DIRECT_URL` | Neon Direct Connection String | `postgresql://neondb_owner:npg_Qtok2RmWK4uT@ep-purple-frost-aimotyfv...` |
| `ADMIN_ALERT_EMAIL` | एडमिन सिक्योरिटी अलर्ट ईमेल | `firozm613@gmail.com` |
| `USE_HTTP_POLLING` | सर्वरलेस आर्किटेक्चर के लिए पूलिंग | `true` |
| `KITE_AUTO_LOGIN_ENABLED` | ऑटो लॉगिन चालू करने का फ्लैग | `true` |

---

## 3. क्लाइंट प्रोफ़ाइल सेटअप (Client Profile Setup)
प्रत्येक एक्टिव क्लाइंट के ऑटो-लॉगिन को काम करने के लिए, एडमिन पैनल में उनके एडिट पेज (`/admin/clients/[id]`) पर निम्न सेटिंग्स भरना ज़रूरी है:
1. **Zerodha Client ID** (जैसे: `RZJ500`)
2. **Zerodha API Key**
3. **Zerodha API Secret**
4. **Zerodha Password**
5. **Zerodha TOTP Secret** (गूगल ऑथेंटिकेटर की सीक्रेट की)

### TOTP Secret कैसे निकालें:
1. **[Kite Zerodha](https://kite.zerodha.com/)** पर लॉगिन करें।
2. **My Profile / Settings > Password & Security** in settings.
3. **2FA TOTP > Enable TOTP** (या Regenerate TOTP) पर क्लिक करें।
4. ईमेल/मोबाइल OTP डालें।
5. स्क्रीन पर दिखने वाले QR Code के नीचे **"Can't scan? Copy key"** पर क्लिक करके अल्फ़ान्यूमेरिक कोड कॉपी करें और उसे **Zerodha TOTP Secret** फ़ील्ड में भरें।

---

## 4. लोकल टेस्टिंग (Local Testing Guide)
ऑटो-लॉगिन सही से काम कर रहा है या नहीं, इसे जांचने के लिए आप प्रोजेक्ट के रूट में मौजूद स्क्रैच स्क्रिप्ट का उपयोग कर सकते हैं।

### कमांड:
```bash
npx ts-node -O '{"module": "commonjs"}' -r dotenv/config scratch/test-autologin.ts
```

### सफलता पर रिस्पॉन्स:
```json
Found client RZJ500. Attempting auto login test...
Auto Login Result: {
  "success": true,
  "accessToken": "your_newly_generated_access_token"
}
```

---

## 5. महत्वपूर्ण फ़ाइलें (Key Codebases)
* **पॉलीफ़िल और डेटाबेस**: [src/lib/db.ts](file:///Users/firozmohammad/Work/growffiy/src/lib/db.ts) (Neon WebSocket Setup)
* **ऑटो-लॉगिन फ़्लो**: [src/lib/kiteAutoLogin.ts](file:///Users/firozmohammad/Work/growffiy/src/lib/kiteAutoLogin.ts)
* **दैनिक शेड्यूलर**: [src/models/algoEngine.ts](file:///Users/firozmohammad/Work/growffiy/src/models/algoEngine.ts)
* **स्टार्ट स्क्रिप्ट**: [package.json](file:///Users/firozmohammad/Work/growffiy/package.json) (Port binding `$PORT`)
