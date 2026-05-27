# Chitraksh AI 👁️📹
> **Spatiotemporal Video Intelligence Platform** — Extracting meaning, anomalies, and the essence of video via natural language processing.

**Chitraksh (चित्राक्ष)** — *The eye that observes visual forms and imagery.*

Chitraksh is a cutting-edge Vision-Language Model (VLM) web application that bridges the gap between raw video footage and semantic understanding. Built for both enterprise monitoring and the creator economy, Chitraksh eliminates manual scrubbing and alert fatigue by allowing users to interact with video using plain English queries.

---

## 🔍 What it Does

Chitraksh acts as an intelligent visual agent that deeply interprets video content over time (spatiotemporal analysis). Instead of relying strictly on flat audio transcripts or basic pixel-movement sensors, it maps visual motion, objects, and structural timelines directly to natural language. 

The platform offers two primary specialized engines to handle entirely different real-world use cases:

### 1. 🚨 Chitraksh / Nazar (Smart Surveillance & Anomaly Detection)
Traditional security systems suffer from massive alert fatigue due to standard, pixel-based motion sensing (e.g., wind blowing trees, stray animals walking past). **Nazar** brings zero-shot temporal learning to video feeds.
* **Context-Aware Safety:** Instruct the security environment using custom natural language prompts: *"Alert me only if someone loiters near the back exit for over 30 seconds."*
* **Sequential Behavior Analysis:** Recognizes sequential actions rather than static object detections—such as distinguishing between a courier delivery agent drop-off scenario versus a package being taken away.
* **Baseline Regularization:** Autonomously adapts to the ordinary day-to-day patterns of an environment and flags only true semantic, high-risk deviations.

### 2. 🎬 Chitraksh / Saar (Dynamic Action Highlighting & Social Clipper)
Most automated short-form clippers rely purely on spoken words and text-based transcripts. **Saar** actively watches the *visual action* inside the frames to isolate high-intensity or unvocalized moments.
* **Visual Action Search:** Query long-form footage dynamically: *"Extract all the goals scored from this match"* or *"Find the specific moment the runner crosses the finish line."*
* **Multi-Modal Synthesis:** Synthesizes facial changes, physical situational pacing, and audio intensity spikes to compute a retention-metric score optimized for social micro-content platforms.
* **Smart Frame Reframing:** Automatically targets the moving subject of interest to shift standard horizontal media layouts cleanly into vertical (9:16) compositions.

---

## 🛠️ System Architecture & Tech Stack

```
   [ User Upload (.mp4/.mkv) / Live Feed ]
                     │
                     ▼
         [ Node.js / Express Backend ] 
                     │
    (Keyframe Extraction & Optimization Pipeline)
                     │
                     ▼
      [ Multimodal Foundation VLM API ] ─── (Gemini 1.5 Pro / Qwen2-VL)
                     │
                     ▼
   [ MongoDB (Stateful Metadata & Session Logs) ]
                     │
                     ▼
  [ React.js / Next.js Responsive Dashboard ]
```

* **Frontend:** React.js / Next.js, Tailwind CSS (Responsive, intuitive dark-themed surveillance dashboard)
* **Backend:** Node.js, Express, MongoDB (Stateful authorization handling, secure video chunk ingestion, metadata caching)
* **Video Layer:** FFmpeg (Handles smart frame-rate downsampling and keyframe isolation to maximize token budget efficiency)
* **VLM Backbones:** Google Gemini 1.5 Pro (Massive native context window built for processing hours of native video sequences) / Qwen2-VL (Open-source foundational standard for deep visual-action mapping)

---

## 📦 Installation & Local Setup

### Prerequisites
* Node.js (v18 or higher)
* MongoDB (Local instance or an Atlas connection URI string)
* API Key for the chosen VLM foundation provider (e.g., Google AI Studio)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/chitraksh-ai.git
cd chitraksh-ai
```

### 2. Configure Environment Variables
Create a `.env` file in your root backend directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chitraksh
JWT_SECRET=your_super_secure_jwt_secret_key
VLM_API_KEY=your_vision_language_model_api_key
```
> ⚠️ **Security Warning:** Never commit your `.env` file to public version control. It is explicitly protected inside the `.gitignore`.

### 3. Install Dependencies & Start
**For Backend:**
```bash
cd backend
npm install
npm run dev
```

**For Frontend:**
```bash
cd frontend
npm install
npm run start
```

---

## 🤝 Contributors

Meet the engineers behind Chitraksh AI:

* **Chitraksh Gupta**
* **Jaish Minocha**

---

## 🎯 Roadmap & Future Integrations
- [ ] Implement WebRTC pipelines for low-latency live IP-Camera network parsing.
- [ ] Integrate local edge-processing logic to skip redundant visual frames before pushing to cloud VLM models (reducing token overhead by up to 70%).
- [ ] Expand the styling dashboard to feature automated burned-in dynamic captions for the **Saar** clipping engine.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
