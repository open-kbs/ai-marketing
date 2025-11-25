// Web Publishing Guide - Instructions for creating marketing web pages and landing pages

export const webPublishingGuide = `WEB PUBLISHING GUIDE - AI Marketing Assistant

Use this guide when creating HTML web publications, landing pages, and marketing materials.

═══════════════════════════════════════════════════════════════════

PURPOSE:
Create professional marketing web pages including:
- Landing pages for products/services
- Event announcement pages
- Portfolio/showcase pages
- Newsletter templates
- Promotional campaigns
- Contact/lead capture pages

═══════════════════════════════════════════════════════════════════

WORKFLOW:

1. Gather requirements from user (purpose, target audience, key message)
2. Create HTML page with publishWebPage command
3. All images can be provided as URLs - they will be automatically uploaded

═══════════════════════════════════════════════════════════════════

HTML REQUIREMENTS:

CRITICAL RULES:
1. Title tag MUST be descriptive for proper filename generation
2. Charset MUST be UTF-8: <meta charset="UTF-8">
3. Mobile-responsive design is required
4. Include proper meta tags for SEO

Modern Marketing Page Template:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Page description for SEO">
  <title>Your Product Landing Page</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Hero Section */
    .hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 100px 0;
      text-align: center;
    }
    .hero h1 {
      font-size: 3em;
      margin-bottom: 20px;
      font-weight: 700;
    }
    .hero p {
      font-size: 1.3em;
      margin-bottom: 30px;
      opacity: 0.95;
    }
    .cta-button {
      display: inline-block;
      padding: 15px 40px;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 1.1em;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    /* Features Section */
    .features {
      padding: 80px 0;
      background: #f8f9fa;
    }
    .features h2 {
      text-align: center;
      font-size: 2.5em;
      margin-bottom: 50px;
      color: #2c3e50;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 40px;
    }
    .feature-card {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.08);
      text-align: center;
      transition: transform 0.3s;
    }
    .feature-card:hover {
      transform: translateY(-5px);
    }
    .feature-icon {
      font-size: 3em;
      margin-bottom: 20px;
    }
    .feature-card h3 {
      font-size: 1.5em;
      margin-bottom: 15px;
      color: #2c3e50;
    }

    /* Contact Section */
    .contact {
      padding: 80px 0;
      background: white;
    }
    .contact h2 {
      text-align: center;
      font-size: 2.5em;
      margin-bottom: 50px;
      color: #2c3e50;
    }
    .contact-form {
      max-width: 600px;
      margin: 0 auto;
    }
    .form-group {
      margin-bottom: 25px;
    }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #555;
    }
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #667eea;
    }
    .submit-button {
      width: 100%;
      padding: 15px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 1.1em;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }
    .submit-button:hover {
      background: #5a67d8;
    }

    /* Footer */
    footer {
      background: #2c3e50;
      color: white;
      padding: 40px 0;
      text-align: center;
    }
    footer p {
      margin-bottom: 10px;
    }
    footer a {
      color: #667eea;
      text-decoration: none;
    }
    footer a:hover {
      text-decoration: underline;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2em;
      }
      .hero p {
        font-size: 1.1em;
      }
      .features h2,
      .contact h2 {
        font-size: 2em;
      }
    }
  </style>
</head>
<body>
  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <h1>Your Amazing Product</h1>
      <p>Transform your business with our innovative solution</p>
      <a href="#contact" class="cta-button">Get Started Today</a>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features">
    <div class="container">
      <h2>Why Choose Us</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">🚀</div>
          <h3>Fast & Reliable</h3>
          <p>Lightning-fast performance that you can count on every single day.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💡</div>
          <h3>Innovative</h3>
          <p>Cutting-edge technology that keeps you ahead of the competition.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🛡️</div>
          <h3>Secure</h3>
          <p>Enterprise-grade security to protect your valuable data.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section class="contact" id="contact">
    <div class="container">
      <h2>Get In Touch</h2>
      <form class="contact-form" action="#" method="POST">
        <div class="form-group">
          <label for="name">Your Name</label>
          <input type="text" id="name" name="name" required>
        </div>
        <div class="form-group">
          <label for="email">Email Address</label>
          <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
          <label for="message">Message</label>
          <textarea id="message" name="message" rows="5" required></textarea>
        </div>
        <button type="submit" class="submit-button">Send Message</button>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="container">
      <p>&copy; 2025 Your Business. All rights reserved.</p>
      <p>Created with AI Marketing Assistant</p>
    </div>
  </footer>
</body>
</html>

═══════════════════════════════════════════════════════════════════

AVAILABLE TEMPLATES:

1. LANDING PAGE - Product/service promotion with CTA
2. EVENT PAGE - Event announcements and registration
3. PORTFOLIO - Showcase work and projects
4. NEWSLETTER - Email marketing templates
5. CONTACT FORM - Lead generation pages
6. PRICING PAGE - Service/product pricing tables
7. ABOUT PAGE - Company/personal introduction

═══════════════════════════════════════════════════════════════════

COLOR SCHEMES FOR DIFFERENT INDUSTRIES:

Tech/Software:
- Primary: #667eea (Purple-blue)
- Secondary: #764ba2 (Purple)
- Accent: #f7b731 (Yellow)

Healthcare:
- Primary: #00b894 (Teal)
- Secondary: #00cec9 (Cyan)
- Accent: #55a3ff (Blue)

Finance:
- Primary: #0984e3 (Blue)
- Secondary: #2c3e50 (Dark gray)
- Accent: #27ae60 (Green)

E-commerce:
- Primary: #e17055 (Orange)
- Secondary: #fdcb6e (Yellow)
- Accent: #6c5ce7 (Purple)

Creative/Design:
- Primary: #fd79a8 (Pink)
- Secondary: #a29bfe (Lavender)
- Accent: #ffeaa7 (Light yellow)

═══════════════════════════════════════════════════════════════════`;