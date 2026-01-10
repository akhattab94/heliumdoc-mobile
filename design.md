# HeliumDoc HealthPlus - Mobile App Design

## Overview

HealthPlus is a comprehensive healthcare mobile application for Qatar featuring doctor search, AI symptom checker, loyalty rewards, referrals, and profile management. The design follows Apple Human Interface Guidelines for a native iOS feel.

## Screen List

### Tab Navigation (5 tabs)
1. **Home** - Main dashboard with search, quick actions, featured doctors
2. **Symptoms** - AI-powered symptom checker
3. **Rewards** - Loyalty program with points and tiers
4. **Referrals** - Doctor-to-doctor referral tracking
5. **Profile** - User settings and information

### Stack Screens
- **DoctorSearch** - Filter and search doctors
- **DoctorProfile** - Detailed doctor information
- **BookAppointment** - Date/time selection and booking
- **SymptomAnalysis** - AI analysis results

## Color Palette

| Token | Light Mode | Usage |
|-------|------------|-------|
| primary | #0D9488 | Main teal accent, buttons, highlights |
| primaryDark | #0F766E | Pressed states, headers |
| secondary | #06B6D4 | Cyan accent for banners |
| background | #F8FAFC | Screen backgrounds |
| surface | #FFFFFF | Cards, elevated surfaces |
| foreground | #1E293B | Primary text |
| muted | #64748B | Secondary text |
| border | #E2E8F0 | Dividers, card borders |
| success | #10B981 | Success states |
| warning | #F59E0B | Warning, ratings |
| error | #EF4444 | Error states |

### Loyalty Tier Colors
- Bronze: #CD7F32
- Silver: #C0C0C0
- Gold: #FFD700
- Platinum: #E5E4E2

## Screen Designs

### 1. Home Screen
**Layout (top to bottom):**
- Hero section with teal gradient background
  - Title: "Find Your Doctor"
  - Subtitle: "Book appointments with top specialists in Qatar"
  - Search bar (white, rounded)
  - Quick action buttons: Clinic Visit, Video Call
- Specialties horizontal scroll (6 items)
  - Icon + label cards (60x60 icons)
  - General, Cardiology, Dermatology, Pediatrics, Neurology, Orthopedics
- Featured Doctors section
  - "See All" link
  - Doctor cards with avatar, name, specialty, rating, price (QAR)
- AI Symptom Checker banner (cyan background)
  - Icon + "AI Symptom Checker" + "Get instant health insights"
  - Chevron right

### 2. Doctor Search Screen
**Layout:**
- Filter bar (horizontal scroll)
  - All, Cardiology, Dermatology, Pediatrics, Orthopedics, Neurology
- Results count
- Doctor list (FlatList)
  - Each card: Avatar, Name, Specialty, Hospital, Rating, Reviews, Price
  - Video consultation badge if available
  - "Book Now" button

### 3. Doctor Profile Screen
**Layout:**
- Header with doctor photo/avatar
- Name, specialty, hospital
- Stats row: Rating, Reviews, Experience, Patients
- About section (bio text)
- Education & Qualifications list
- Available slots section
  - Date selector (horizontal scroll)
  - Time slots grid
- "Book Appointment" CTA button (fixed bottom)

### 4. Book Appointment Screen
**Layout:**
- Doctor summary card
- Date picker (calendar style)
- Time slots grid
- Consultation type toggle (Clinic/Video)
- Price summary
- "Confirm Booking" button

### 5. Symptom Checker Screen
**Layout:**
- Header: "What symptoms are you experiencing?"
- Category tabs (horizontal scroll)
  - General, Head, Eyes/Ears, Respiratory, Heart, Digestive, Muscles, Skin, Mental
- Symptom checkboxes grid (2 columns)
- Selected symptoms chips
- Patient info inputs (Age, Gender)
- "Analyze Symptoms" button

### 6. Symptom Analysis Screen
**Layout:**
- Analysis complete header
- Possible conditions cards
  - Condition name, likelihood %, description
  - Severity indicator
- Recommended specialist section
- Self-care tips list
- "Find Specialist" CTA button

### 7. Loyalty Screen
**Layout:**
- Points balance card (large number)
- Tier badge and progress bar
- Tier benefits list
- Activity history section
- Available rewards grid
  - Reward cards with points cost, description

### 8. Referrals Screen
**Layout:**
- Active referrals section
  - Referral cards with status badge
  - From doctor, To doctor, Date, Status
- Referral history section
- Status legend (Pending, Accepted, Completed)

### 9. Profile Screen
**Layout:**
- User avatar and name header
- Menu list items:
  - Personal Information
  - Medical History
  - Insurance Details
  - Notification Settings
  - Language (English/Arabic)
  - Help & Support
  - Logout

## Key User Flows

### Doctor Booking Flow
1. Home → Search bar or Specialty card
2. Doctor Search → Filter/browse doctors
3. Doctor Profile → View details, select slot
4. Book Appointment → Confirm date/time
5. Confirmation screen

### Symptom Check Flow
1. Symptoms tab → Select category
2. Check symptoms → Enter age/gender
3. Analyze → View results
4. Find Specialist → Navigate to doctor search

### Loyalty Redemption Flow
1. Rewards tab → View points balance
2. Browse rewards → Select reward
3. Confirm redemption → Success message

## Typography

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| Title | 32px | Bold | Screen titles |
| Heading | 24px | Bold | Section headers |
| Subheading | 20px | SemiBold | Card titles |
| Body | 16px | Regular | Main content |
| Caption | 14px | Regular | Secondary text |
| Small | 12px | Regular | Labels, badges |

## Component Patterns

### Cards
- White background
- 12-16px border radius
- Soft shadow (0 2px 4px rgba(0,0,0,0.1))
- 16px padding

### Buttons
- Primary: Teal background, white text, rounded-full
- Secondary: White background, teal border, teal text
- Press feedback: Scale 0.97, opacity 0.9

### Icons
- Ionicons library
- Size: 24px (standard), 28px (tab bar), 32px (feature icons)

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
