# Project TODO

## Core Setup
- [x] Theme configuration (teal color palette)
- [x] Tab bar navigation setup
- [x] Icon mappings for all screens
- [x] App logo generation
- [x] Splash screen setup
- [x] App configuration update

## Home Screen
- [x] Greeting with user name
- [x] Search bar
- [x] Quick action buttons (Find Doctor, Video Consult, Symptoms, Referrals)
- [x] Upcoming appointments section
- [x] Recent doctors section
- [x] AI Symptom Checker banner
- [x] Connected to API for doctors data

## Doctor Search Screen
- [x] Search and filter functionality
- [x] Specialty filter tabs
- [x] Doctor cards with ratings, price, availability
- [x] Video consultation badges
- [x] Quick book button
- [x] Connected to API for real doctor data

## Doctor Profile Screen
- [x] Doctor header with photo and stats
- [x] About section
- [x] Education and qualifications
- [x] Languages spoken
- [x] Available time slots
- [x] Date picker
- [x] Book appointment button
- [x] Connected to API for doctor details and schedules

## Book Appointment Screen
- [x] Doctor summary card
- [x] Date and time display
- [x] Consultation type selection (clinic/video)
- [x] Payment summary with VAT
- [x] Confirm booking button
- [x] Connected to API for booking

## Symptom Checker Screen
- [x] Body part/category selection
- [x] Symptom selection grid
- [x] Patient info input (age, gender)
- [x] Analyze button
- [x] Disclaimer notice

## Symptom Analysis Screen
- [x] Loading state animation
- [x] Possible conditions list with likelihood
- [x] Severity indicators
- [x] Recommended specialist
- [x] Self-care tips
- [x] Find doctor CTA

## Loyalty/Rewards Screen
- [x] Points balance display
- [x] Tier status and progress
- [x] Tier benefits list
- [x] Available rewards grid
- [x] Redeem functionality
- [x] Activity history
- [x] How to earn points section
- [x] Connected to API for rewards data

## Referrals Screen
- [x] Referral list with status
- [x] Filter tabs (All, Active, Completed)
- [x] Referral cards with from/to doctors
- [x] Urgency and status badges
- [x] Qatar healthcare network info

## Profile Screen
- [x] Profile header with user info
- [x] Quick stats (appointments, points, tier)
- [x] Settings toggles (dark mode, biometric)
- [x] Menu items for account settings
- [x] Support section
- [x] Logout button

## GitHub Integration
- [x] Create GitHub repository
- [x] Push code to repository

## Backend Infrastructure (Production Scale)

### Database
- [x] Database schema design (17 tables)
- [x] Database migrations
- [x] Seed database with real HeliumDoc data (23 doctors, 18 hospitals, 27 specialties)

### API Endpoints
- [x] Doctors router (list, getById, getSchedule, getAvailableSlots, getReviews)
- [x] Appointments router (list, getById, book, cancel, reschedule)
- [x] Specialties router (list, getById)
- [x] Hospitals router (list, getById, getDoctors)
- [x] Loyalty router (getTiers, getStatus, getTransactions, getRewards, redeemReward, getMyRewards)
- [x] Referrals router (list, getById, accept)

### Mobile App API Integration
- [x] Home screen connected to doctors API
- [x] Doctor search connected to doctors/specialties API
- [x] Doctor profile connected to doctor details API
- [x] Book appointment connected to booking API
- [x] Rewards screen connected to loyalty API

### Data Scraping
- [x] Scrape HeliumDoc.com for doctor data
- [x] Extract specialties, hospitals, and doctor profiles
- [x] Seed database with real data


## User Authentication
- [x] Phone number login with OTP verification
- [x] Email login with password
- [x] User registration flow
- [x] Auth router with OTP and email endpoints
- [x] Session persistence with secure storage
- [x] Login screen UI with phone/email/register tabs

## Push Notifications
- [x] Expo push notification setup
- [x] Device token registration
- [x] Appointment reminder scheduling
- [x] Referral status update notifications
- [x] Notifications router API
- [x] Notifications list screen UI

## Payment Gateway
- [x] Payment service integration (Stripe-like for Qatar)
- [x] Payment flow during booking
- [x] Payment screen with card input
- [x] Payment methods (Card, Apple Pay, QPay, NAPS)
- [x] Payments router API
- [x] Refund request functionality


## Symptom Checker API Integration (Infermedica)
- [x] Create Infermedica API router on server
- [x] Add environment variables for API credentials
- [x] Update symptom checker screen to use real API
- [x] Implement dynamic question rendering
- [x] Display triage results with care recommendations


## Self-Hosted ML Symptom Checker
- [x] Research GitHub ML repositories for symptom prediction
- [x] Clone and evaluate sohamvsonar/Disease-Prediction model
- [x] Set up Python ML environment on server
- [x] Create FastAPI wrapper for the ML model
- [x] Integrate with existing symptom checker API
- [x] Update mobile app to use ML predictions
- [x] Test accuracy and performance

## Future Enhancements (Planned)
- [ ] Arabic language support with RTL interface
- [ ] Arabic translations for all screens
- [ ] Wearable device integration (Apple Health, Google Fit)
- [ ] Calendar sync for appointments

## Mediktor-Style Symptom Checker (Full Implementation)

- [x] Analyze Mediktor demo session UX flow
- [x] Document question types and conversation patterns
- [x] Scrape Mediktor diseases database (280+ conditions)
- [x] Scrape Mediktor symptoms database (350+ symptoms)
- [x] Expand diseases with detailed medical info (descriptions, causes, treatments)
- [x] Create symptom-disease mapping with weighted relationships
- [x] Build dynamic follow-up questions system
- [x] Implement conversational chat-style UI
- [x] Add 5-level triage system (Very Low, Low, Medium, High, Emergency)
- [x] Create results page with condition cards and specialist recommendations
- [x] Add warning signs and self-care tips for each condition
- [x] Add doctor booking integration from results


## Infermedica API Integration (Live)
- [x] Configure Infermedica API credentials (App ID: 1cef96b9)
- [x] Update symptom checker router to use real Infermedica endpoints
- [x] Implement /symptoms endpoint for fetching symptom list
- [x] Implement /diagnosis endpoint for condition analysis
- [x] Implement /triage endpoint for urgency assessment
- [x] Update mobile app to use live Infermedica data
- [x] Test with real symptom scenarios


## UI Improvements
- [x] Redesign Symptoms tab with polished, professional look
