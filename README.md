# AdaptUI

> **Interfaces that adapt to you, not the other way around.**

AdaptUI is a proof-of-concept React Native app that uses AI to generate custom user interfaces on-demand. Instead of navigating through multiple apps for different tasks, you ask AdaptUI what you need, and it creates a purpose-built interface just for that moment.

---

## 🎯 The Problem

You have 50+ apps on your phone. To plan a weekend trip, you:
1. Open Google Maps to find places
2. Switch to Weather app to check forecast
3. Open Yelp for restaurant reviews
4. Jump to Notes to write an itinerary
5. Check Calendar for availability
6. Back to Maps for directions

**This is exhausting.**

---

## 💡 The Solution

AdaptUI generates a single, unified interface for your specific need:

**You:** *"Plan a weekend trip to Portland - I like coffee, hiking, and indie bookstores"*

**AdaptUI:** Creates a custom UI with:
- Weather forecast for the weekend
- Map with pinned coffee shops, trails, and bookstores
- Itinerary timeline with travel times
- Quick notes section
- Deep links to Google Maps/Yelp

All in one screen. No app switching. No context loss.

---

## 🏗️ How It Works

### 1. **Intelligent Categorization**
AdaptUI analyzes your query and determines the best category:
- **Travel Planning** - Trips, itineraries, destinations
- **Local Discovery** - Events, restaurants, things nearby
- **Research** - Comparisons, analysis, information gathering

### 2. **AI-Powered UI Generation**
Using Google Gemini, AdaptUI:
- Applies advanced reasoning patterns (Tree of Thought, ReAct, Chain of Thought)
- Generates a JSON schema defining the UI components
- Renders a native React Native interface

### 3. **Adaptive Rendering**
The UI adapts to:
- Your query context
- Device type (phone/tablet)
- Previous interactions
- User preferences

---

## 🎨 Design Philosophy

### Dual Theme System
AdaptUI features two distinct visual styles:

**Glassmorphism** - Modern, elegant, professional
- Frosted glass effects with blur
- Dark gradients and subtle shadows
- Smooth, spring-based animations
- Perfect for focused, immersive experiences

**Neo-Brutal** - Bold, playful, high-energy
- Sharp edges and thick borders
- High contrast black/white with neon accents
- Hard shadows and instant feedback
- Perfect for quick, decisive interactions

Users can switch themes instantly with a single tap.

---

## 🚀 Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build tooling
- **TypeScript** - Type safety and developer experience
- **Reanimated 2** - 60fps animations on UI thread
- **Zustand** - Lightweight state management

### AI/Backend
- **Google Gemini** - LLM for reasoning and UI generation
- **LangChain** - AI orchestration and tool calling
- **SQLite** - Local persistence and caching
- **Expo Blur** - Native blur effects for glassmorphism

### Architecture
- **CategoryManager** - Intelligent query classification
- **LLMCore** - Multiple reasoning patterns (ToT, ReAct, CoT)
- **WorkflowEngine** - Background job processing with DAG execution
- **DatabaseService** - Persistent storage for queries and preferences

---

## 📱 Current Status

### ✅ Implemented
- Dual theme system (Glass/Brutal) with instant switching
- Animated landing page with smooth 60fps transitions
- Category system with keyword-based classification
- Core services (CategoryManager, DatabaseService, WorkflowEngine)
- LLM integration with Gemini
- Component renderer for dynamic UIs
- Haptic feedback on all interactions

### 🚧 In Progress
- Real API integrations (Google Places, OpenWeather)
- Map component with interactive pins
- Timeline/itinerary component
- Deep linking to external apps

### 📋 Planned
- Voice input
- Image recognition for visual queries
- Multi-step workflows
- Collaborative features
- Offline mode with caching

---

## 🎯 Use Cases

### Travel Planning
*"Plan a 3-day trip to Tokyo for a foodie"*
- Restaurant recommendations by neighborhood
- Food market tours
- Cooking class bookings
- Transit directions

### Local Discovery
*"What's happening this weekend in SF?"*
- Events calendar
- Weather-aware suggestions
- Restaurant reservations
- Activity recommendations

### Research & Comparison
*"Compare electric cars under $40k"*
- Side-by-side specs
- Pros/cons analysis
- Price trends
- User reviews summary

### Quick Tasks
*"Find a coffee shop with WiFi near me"*
- Map with nearby options
- Hours and ratings
- Walking directions
- One-tap navigation

---

## 🏃 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd AdaptUI

# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web
```

### Configuration

1. **Gemini API Key** - Add your key to `app/index.tsx`:
```typescript
const GEMINI_API_KEY = 'your-api-key-here';
```

2. **Theme Preference** - Toggle between Glass/Brutal using the button in top-right

---

## 📖 Documentation

- **[THEME_GUIDE.md](./THEME_GUIDE.md)** - Complete theme system documentation
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide and demo script
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[DOC.md](./DOC.md)** - Original product specification

---

## 🎨 Design Inspiration

AdaptUI draws inspiration from:
- **Nothing OS** - Essential apps concept
- **Arc Browser** - Adaptive, context-aware UI
- **Stripe** - Clean, professional design
- **Linear** - Smooth animations and interactions
- **Vercel** - Dark mode aesthetics

---

## 🤔 Philosophy

### Why AdaptUI?

**Traditional Apps:**
- One app = one purpose
- Fixed UI for all users
- Context switching kills flow
- 50+ apps on your phone

**AdaptUI:**
- One app = infinite purposes
- Custom UI for each query
- No context switching
- Interfaces that adapt to you

### The Vision

We believe the future of mobile interfaces is:
- **Generative** - Created on-demand, not pre-built
- **Contextual** - Aware of your situation and needs
- **Adaptive** - Changes based on your behavior
- **Unified** - One interface for multiple data sources

AdaptUI is a step toward that future.

---

## 🚧 Limitations

This is a **proof-of-concept**. Current limitations:

- **No real API integrations** - Responses are simulated
- **Limited categories** - Only 3 categories implemented
- **No offline mode** - Requires internet connection
- **No user accounts** - All data is local
- **English only** - No i18n support yet

---

## 🤝 Contributing

This is a research project exploring the future of adaptive interfaces. Contributions, ideas, and feedback are welcome!

### Areas for Contribution
- UI/UX design improvements
- Additional reasoning patterns
- New category implementations
- API integrations
- Performance optimizations

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Google Gemini** - AI reasoning and generation
- **Expo Team** - Amazing mobile development platform
- **React Native Community** - Incredible ecosystem
- **Nothing OS** - Inspiration for adaptive interfaces

---

## References

### Google

- [Places API](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Places Insights API](https://developers.google.com/maps/documentation/places-aggregate/make-your-first-request)
- [Place Insights](https://blog.afi.io/blog/google-places-insights-api/)
- [More Place Insights](https://mapsplatform.google.com/resources/blog/how-to-get-started-with-new-gemini-model-capabilities-for-places-api/)

---

## 📬 Contact

Questions? Ideas? Feedback?

Open an issue or start a discussion on GitHub.

---

**Built with ❤️ and AI**

*AdaptUI - Interfaces that adapt to you.*
