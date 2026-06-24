# AeroQR Studio — Premium Client-Side QR Suite

AeroQR Studio is a premium, client-side web application designed to generate, customize, and scan QR codes with a stunning **Apple Light Glassmorphic** aesthetic. Built with pure HTML, CSS, and JavaScript, it offers modern design mechanics, real-time readability feedback, local templates collection, and advanced content formats like fully-featured vCards with embedded photos.

---

## 🌟 Key Features

### 1. Guided 3-Step Wizard Flow
- **Step 1: Choose Type** — Immersive card-based selection grid with clean SVG iconography.
- **Step 2: Add Content** — Custom forms for different payload types, with client-side validation.
- **Step 3: Design & Styling** — Detailed accordions to shape dots, outer frames, inner dots, background, and brand overlays.
- **Micro-interactions** — Smooth slide-in wizard transitions, segmented stepper status, and interactive 3D perspective tilt physics on the live preview card.

### 2. Rich Payload Templates
- **Contact Card (vCard 3.0)**: Supports full profile information (First/Last name, Job Title, Organization, Phone, Email, separate Work/Home Addresses, Website, and Memo).
  - *Embedded Contact Photo*: Compresses uploaded photos in-browser to a square `48x48` thumbnail at `0.4` JPEG quality. This keeps the QR payload small enough to remain highly readable (~900 bytes).
- **Wi-Fi Profiles**: Configures SSID, security type (WPA, WEP, None), and network hidden flags.
- **Website URLs**: Encodes links with automatic HTTP/HTTPS prefix validation.
- **Action Triggers**: Short-hand templates for email composition, SMS, and telephone calls.
- **Social Coordinates**: Preset endpoints for Instagram, X/Twitter, LinkedIn, YouTube, Facebook, and GitHub.

### 3. Designer Customization Engine
- **Body Dot Styles**: Select shapes (Square, Circle, Rounded, Extra-Rounded, Classy, Classy Rounded) and apply solid colors or linear/radial gradients.
- **Corner Squares (Outer Frame)**: Customize frame shapes (Square, Dot, Extra-Rounded, Out-Rounded, In-Rounded) and fills.
- **Corner Dots (Inner Dots)**: Customize dot shapes (Square, Dot, Rounded, Heart) and fills.
- **Branding Logos**: Select preset icons (Contact, WiFi, Mail, Phone, Instagram, etc.) or upload custom PNG/JPG logos.
- **Resolution & Padding**: Slide canvas size (250px to 1000px), outer margin, and set high-tolerance error correction levels (H — 30% recovery, recommended for logos).

### 4. Live Verification & Scanner
- **Auto-Readability Validation**: Operates a background instance of `jsQR` that automatically decodes the canvas on every slider adjust, warning the user if design customizations degrade code readability.
- **Built-in Scanner**: Supports live webcam scanning (with laser crosshair alignment highlights) and file-upload decodes.
- **Structured Content Parsing**: Displays parsed QR codes in formatted cards (e.g. WiFi password copy widgets or vCard summaries with `.vcf` file exports).

### 5. Local Studio History Collection
- Save custom templates directly into your browser's local storage.
- Includes custom thumbnail renders and config states so you can reload, edit, or download designs in one click.

---

## 🛠️ Tech Stack & Dependencies

- **Frontend Core**: HTML5, Vanilla CSS3 (Custom Glassmorphism system), Vanilla JS (ES6+).
- **QR Rendering**: [qr-code-styling](https://github.com/kojiro/qr-code-styling) (in-browser custom QR builder).
- **QR Reader & Decoder**: [jsQR](https://github.com/cozmo/jsQR) (in-browser webcam and image decoding).
- **Icons**: [Lucide Icons](https://lucide.dev/) (premium clean vector iconography).

---

## 🚀 Quick Start & Development

Ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Install dependencies
```bash
npm install
```

### 2. Start the development server
```bash
npm run dev
```
The application will be served locally at: **`http://localhost:3000`**

*Alternatively, if Node is not available, you can host the root directory using Python:*
```bash
python -m http.server 3000
```

---

## 📁 Project Structure

```
├── index.html     # Page layout, inputs, forms, and third-party script imports
├── style.css      # Core Design System, frosted glass UI theme, range/color selectors
├── app.js         # QR styling options builder, vCard parser, webcam feeds, and history logs
├── package.json   # Node developer scripts
└── README.md      # This suite documentation
```

---

## 📄 License
This project is open-source. Feel free to modify and build upon it!
