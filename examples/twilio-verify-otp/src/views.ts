export function renderLoginPage() {
    return `
      <h2>Enter your phone</h2>
      <input
        type="tel"
        id="phone"
        placeholder="+1234567890"
        required
        pattern="^\\+[1-9]\\d{1,14}$"
        inputmode="tel"
      />
      <button onclick="requestOTP()">Send OTP</button>
  
      <div id="verifySection" style="display:none;">
        <h2>Enter OTP</h2>
        <input
          type="text"
          id="code"
          pattern="^\\d{6}$"
          maxlength="6"
          inputmode="numeric"
          required
        />
        <button onclick="verifyOTP()">Verify</button>
      </div>
  
      <script>
        let phone = "";
  
        async function requestOTP() {
          const phoneInput = document.getElementById("phone");
          phone = phoneInput.value.trim();
  
          const phoneRegex = /^\\+[1-9]\\d{1,14}$/;
          if (!phoneRegex.test(phone)) {
            alert("Please enter a valid phone number in international format (e.g. +1234567890).");
            return;
          }
  
          const res = await fetch('/auth/request', {
            method: 'POST',
            body: JSON.stringify({ phone }),
            headers: { 'Content-Type': 'application/json' },
          });
  
          const data = await res.json();
          if (data.message) {
            document.getElementById("verifySection").style.display = "block";
          } else {
            alert(data.error || 'Failed to send OTP');
          }
        }
  
        async function verifyOTP() {
          const code = document.getElementById("code").value.trim();
  
          if (!/^\\d{6}$/.test(code)) {
            alert("Please enter a valid 6-digit code.");
            return;
          }
  
          const res = await fetch('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ phone, code }),
            headers: { 'Content-Type': 'application/json' },
          });
  
          const data = await res.json();
          if (data.redirectTo) {
            window.location.href = '/';
          } else {
            alert(data.error || 'Verification failed');
          }
        }
      </script>
    `;
  }
  

export function renderWelcomePage(phone: string, exp: number) {
    return `
      <h2>Welcome back, ${phone}!</h2>
      <p>Session expires in: <span id="countdown">--:--</span></p>
      <form method="POST" action="/logout">
        <button type="submit">Logout</button>
      </form>
  
      <script>
        const exp = ${exp};
        const countdownEl = document.getElementById('countdown');
  
        function updateCountdown() {
          const now = Math.floor(Date.now() / 1000);
          const diff = exp - now;
  
          if (diff <= 0) {
            countdownEl.textContent = "Expired";
            document.body.innerHTML = "<h1>Session expired. Please <a href='/'>login again</a>.</h1>";
            return;
          }
  
          const minutes = Math.floor(diff / 60);
          const seconds = diff % 60;
          countdownEl.textContent = \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
        }
  
        updateCountdown();
        setInterval(updateCountdown, 1000);
      </script>
    `;
}
