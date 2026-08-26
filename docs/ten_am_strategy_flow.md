# Ten AM Strategy — Simple Business Logic & Examples

Yeh document Ten AM Strategy ke pure flow ko simple bhasha mein samjhata hai, taaki non-technical users bhi samajh sakein ki system kab, kyu aur kitne amount ka trade leta hai.

---

## 1. 09:30 AM (Stock Scanning - No Trading Yet)
Theek **09:30 AM** par, system NSE mein Nifty 500 ke saare 500 stocks ka snapshot (data) uthata hai.
- **Kya hota hai?** System un sabhi stocks ko unke % Change ke hisaab se line mein laga deta hai (Sabse zyada badhne wale stocks top par, aur sabse zyada girne wale bottom par).
- **Kyu?** Taaki 10 baje system ko dhundna na pade. Wo direct Top 20 Gainers aur Top 20 Losers ko apni memory mein save rakh leta hai.

---

## 2. 10:00 AM (Capital & Risk Rules)

Jab **10:00 AM** bajjte hain, toh system sabse pehle client ka Zerodha Live Balance check karta hai, aur Admin ke banaye rules (Per Day Amount ya Risk %) apply karta hai.

### Case A: Client ke paas Balance kam hai (Trade Cancelled)
- **Scenario:** Admin ne rule lagaya hai ki `Per Day Trade Amount = ₹5,000` hona chahiye. Lekin client ke Zerodha account mein sirf `₹3,000` balance hai.
- **Action:** System turant trade ko SKIP kar dega aur log likhega: *"Margin kam hai, isliye trade nahi liya."*

### Case B: Balance poora hai (Fixed Risk)
- **Scenario:** Admin ne `Per Day Trade Amount = ₹2,000` set kiya hai. Client ke account mein `₹50,000` hain.
- **Action:** System kisi percentage calculation mein nahi padega. Wo seedha maan lega ki **aaj ka Total Risk ₹2,000 hai**.

### Case C: Per Day Amount Set NAHI hai (Risk % Rule)
- **Scenario:** Admin ne Per Day Amount blank rakha hai, aur `Risk = 2%` set kiya hai. System check karega ki Database mein Capital kitna likha hai (Jaise ₹1,00,000) aur Zerodha mein Live Balance kitna pada hai (Jaise ₹80,000).
- **Action:** System in dono mein se jo chhota (minimum) hoga (yani ₹80,000) usko final capital maanega. Phir ₹80,000 ka 2% nikalega = **₹1,600**. (Toh aaj ka Total Risk ₹1,600 ban jayega).

---

## 3. Double Division Rule (Capital ko Baantna)
System over-trading aur high risk se bachne ke liye total margin ko **2 baar divide** karta hai:

**Step 1: Strategy Level Division**
- Agar client ke account mein Total Live Margin ₹2,00,000 hai.
- System dekhega ki client ko 2 strategies assigned hain (Jaise: Pre-Open aur 10 AM).
- **Action:** System ₹2,00,000 ko 2 se divide kar dega. Toh **10 AM Strategy ke hisse mein ₹1,00,000 Capital aayegi.** (Aur yahi ₹1,00,000 upar wale Case C mein 2% calculate karne ke liye use hogi, jisse ₹2,000 ka Total Risk banega).

**Step 2: Leg Level Division (Only for 10 AM)**
- Pre-Open mein ek waqt pe sirf ek hi trade (Leg) active hoti hai. Lekin 10 AM Strategy mein Gainers (Buy) aur Losers (Sell) dono sath chalti hain.
- Maan lijiye Step 1 ke baad system ke paas **Total Risk ₹1,000** bacha.
- System check karega ki strategy mein 2 Legs ON hain.
- **Action:** System ₹1,000 ko 2 se divide kar dega.
  - **Leg 1 (Gainers) ko milega = ₹500 Risk**
  - **Leg 2 (Losers) ko milega = ₹500 Risk**

*(Is 2-step division se client ka fund hamesha secure rehta hai aur ek trade mein poora paisa block nahi hota).*

---

## 4. Leg 1 (Top Gainers - BUY) ka Pura Example

Maan lijiye **TATASTEEL** aaj ka sabse bada Gainer hai (Position #1).

1. **Pattern Check (GRG):**
   - System TATASTEEL ki 9:15, 9:30, aur 9:45 ki candles check karega.
   - **Condition:** Agar wo Green-Red-Green pattern nahi bani hai, toh system TATASTEEL ko chhod dega aur Position #2 wale stock ko check karega.

2. **Circuit Limit Protection (Sabse Important Safeguard):**
   - Maan lijiye TATASTEEL pattern test pass kar leta hai. Uska Entry Price ₹150 banta hai.
   - System Zerodha se TATASTEEL ka live **Upper Circuit Limit** (maximum price jahan aaj trade ho sakti hai) mangayega. Agar Circuit ₹150 par hi laga hua hai.
   - **Action:** System is stock mein **Entry nahi lega** aur ise turant SKIP kar dega (Kyunki circuit lagne ke baad aap phas sakte hain).

3. **Trade Fire Hona (Agar sab sahi ho):**
   - **Entry Price:** ₹150
   - **Stoploss Price:** ₹148
   - **Target:** ₹154 (1:2 Reward)
   - **Quantity Calculation:** Leg 1 ka Risk ₹500 hai. Ek share pe ₹2 ka risk hai (150 - 148). Toh Quantity hogi = 500 / 2 = **250 Shares**.
   - **Action:** System Zerodha mein 250 Shares ka SL-Market order Buy ke liye laga dega.
   - **Post-Fill Action:** Jaise hi ye Buy order fill (COMPLETE) ho jayega, system sabse pehle turant ek **Stoploss (SL-Market)** order ₹148 par laga dega. Uske theek **30 seconds baad** system ek **Target (Limit)** order ₹154 par place karega (taaki order rejection se bacha ja sake).

---

## 5. Leg 2 (Top Losers - SELL) ka Pura Example

Maan lijiye **INFY** aaj ka sabse bada Loser hai.

1. **Pattern Check (RGR):**
   - System INFY ki 9:45 tak ki candles dekhega. Agar Red-Green-Red pattern banta hai, tabhi aage badhega. Nahi toh reject karke next loser par jayega.

2. **Circuit Limit Protection:**
   - Agar INFY buri tarah gir chuka hai aur apne **Lower Circuit Limit** (maximum girne ki hadd) ko touch kar raha hai.
   - **Action:** System isme trade **Nahi lega** aur skip kar dega.

3. **Trade Fire Hona:**
   - **Entry Price:** ₹1000
   - **Stoploss Price:** ₹1020
   - **Target:** ₹960 (1:2 Reward)
   - **Quantity Calculation:** Leg 2 ka Risk ₹500 hai. Ek share pe ₹20 ka risk hai. Quantity hogi = 500 / 20 = **25 Shares**.
   - **Action:** System Zerodha mein 25 Shares ka SL-Market order Sell (Short) ke liye laga dega.
   - **Post-Fill Action:** Jaise hi ye Sell order fill (COMPLETE) ho jayega, system sabse pehle turant ek **Stoploss (SL-Market)** order ₹1020 par Buy ke liye laga dega. Uske theek **30 seconds baad** system ek **Target (Limit)** order ₹960 par place karega.

---
**Conclusion:** Ye system fully smart hai. Yeh live margin check karta hai, risk ko har leg mein barabar baant ta hai, aur kisi bhi aise stock mein trade nahi leta jisme Circuit lagne ka khatra ho.

---

## 6. Legs ki Independence (No OCO Rule)
Pre-Open strategy **OCO (One Cancels Other)** par kaam karti hai (Ek leg lagne par dusri cancel ho jati hai). Lekin 10 AM Strategy mein **Leg 1 aur Leg 2 ka aapas mein koi connection nahi hai.**
- Agar Gainers wali trade (Leg 1) ka order fill hota hai, aur usi waqt Losers wali trade (Leg 2) ka order bhi fill hota hai, toh **dono chalte rahenge**.
- Dono trades apne-apne alag Target aur Stoploss orders ko follow karenge. Ek trade ke hit ya cancel hone ka dusri trade par koi asar nahi padega.
