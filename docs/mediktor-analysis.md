# Mediktor Symptom Checker Analysis

## UX Flow Structure

### 1. Initial Input
- Free text symptom entry ("What are your symptoms?")
- Gender selection (Male/Female)
- Age input (numeric)
- Location (optional, improves accuracy)

### 2. Symptom Refinement
- System suggests related symptoms based on initial input
- Example: "headache" → offers: Facial trauma, Headache, Headache at temples, Headache due to stress, Headache in forehead area, Pain in face

### 3. Dynamic Follow-up Questions
Questions adapt based on selected symptoms. Example flow for headache:
- Type of physical trauma (if trauma selected)
- Type of fall (Fall due to leg giving out, etc.)
- Bleeding? (Yes/No)
- Pain intensity scale (1-10, grouped as Mild 1-2, Moderate 3-5, etc.)
- Duration: How long ago symptoms started (Hours/Days/Weeks)
- Specific duration (e.g., "2 days")
- Medical history questions (previous diagnoses)
- Symptom comparison to previous episodes
- Onset pattern (slowly/suddenly)
- Stress correlation
- Response to painkillers

### 4. Results Page Structure

#### Recommendation Section
- Clear action text: "Check your case with a health professional and, if your condition worsens, go to a hospital."

#### Urgency Level
- Visual indicator with colored dots
- Levels: Low urgency, Medium urgency, High urgency, Emergency
- Color coding: Teal (low) → Yellow → Orange → Red (emergency)

#### Relevant Findings
- Checkmarked list of confirmed symptoms/findings
- Example: ✓ Facial trauma

#### Possible Diseases
- Ranked list with match level
- High match / Low match indicators
- Progress bar visualization
- Expandable for details
- "See less relevant conditions" toggle

#### Specialties
- Recommended medical specialty
- Example: "Family Medicine - High match"
- "See more specialties" expandable

#### Contextual Information
- Location icon with location
- Date of assessment
- Time of assessment

### 5. Profile Creation CTA
- Prompt to create profile for better assessments
- Help link explaining benefits

## Data Structure Needed

### Symptoms Table
- symptom_id
- symptom_name
- symptom_category (body part/system)
- related_symptoms (array)
- follow_up_questions (array of question_ids)

### Questions Table
- question_id
- question_text
- question_type (yes_no, scale, single_choice, multi_choice, numeric, duration)
- options (for choice questions)
- triggers (conditions to show this question)
- next_question_logic

### Conditions/Diseases Table
- condition_id
- condition_name
- symptoms_required (weighted)
- urgency_level
- recommended_specialty
- description
- self_care_advice

### Urgency Levels
1. Low urgency (teal) - "Check with health professional"
2. Medium urgency (yellow) - "See a doctor within 24-48 hours"
3. High urgency (orange) - "See a doctor today"
4. Emergency (red) - "Go to emergency room immediately"

## Question Types Observed

1. **Yes/No** - Simple binary
2. **Scale 1-10** - Pain intensity with groupings
3. **Single Choice** - Select one option
4. **Multi-Select** - Select multiple symptoms
5. **Numeric Input** - Age, duration numbers
6. **Duration** - Time unit + number combination
7. **Location** - Geographic input

## Key UX Patterns

1. **Conversational Flow** - Chat-like interface
2. **Progressive Disclosure** - Questions appear one at a time
3. **Smart Suggestions** - Related symptoms auto-suggested
4. **Visual Feedback** - Progress bars, color coding
5. **Expandable Details** - "See more" for additional info
6. **Clear CTAs** - View report, Create profile buttons


## Condition Detail Modal Structure

When clicking on a condition (e.g., "Tension headache"), a modal appears with 3 tabs:

### Tab 1: Relevant Answers
- Shows the user's answers that led to this diagnosis

### Tab 2: Advice
Contains two sections:

**Symptoms to watch out for (Warning Signs):**
- Fever (temperature higher than 100.4°F)
- Neck stiffness
- If accompanied by seizures
- Loss of sensibility and/or motility in limbs
- If you have suffered a trauma

**Self-care recommendations:**
- Take over-the-counter pain relievers or anti-inflammatories
- Lie down in a dark, quiet room
- Behavioral therapy, relaxation techniques or stress management training

### Tab 3: More Information
- Detailed description of the condition
- Causes
- Risk factors
- When to see a doctor

## Data to Scrape for Each Condition

For each disease/condition, we need:
1. condition_name
2. match_level (High/Low/Medium)
3. warning_signs (array)
4. self_care_tips (array)
5. description
6. causes
7. risk_factors
8. recommended_specialty


## More Information Tab Structure

### Disease Information Section
- **Image**: Visual representation of the condition
- **Urgency Level**: "Very low urgency" with colored dot indicators
- **Prevalence**: "Very common" / "Common" / "Rare"
- **Severity**: "Mild" / "Moderate" / "Severe"

### Description
Full medical description of the condition including:
- What triggers it
- How it manifests (symptoms)
- Location of pain/discomfort
- Diagnosis method
- Treatment options

Example for Tension Headache:
"Most common headache triggered by stress, depression and/or anxiety. Manifests with oppressive headache, pain in the temples, scalp and the rear part of the neck and shoulders. Diagnosis is clinical and it is treated with regular painkillers or with those associated with muscle relaxants and/or anti-anxiety drugs. Behavioral therapy, relaxation techniques or training in the management of stress is recommended."

## Urgency Level Scale (5 levels)
1. Very low urgency (teal/cyan dot)
2. Low urgency (green dot)  
3. Medium urgency (yellow dot)
4. High urgency (orange dot)
5. Emergency (red/pink dot)

## Prevalence Categories
- Very common
- Common
- Uncommon
- Rare
- Very rare

## Severity Categories
- Mild
- Moderate
- Severe
- Critical


## Sample Conditions from Headache Assessment

| Condition | Match Level | Progress Bar |
|-----------|-------------|--------------|
| Tension headache | High match | ~90% filled |
| Common headache | Low match | ~25% filled |
| Anxiety disorder | Low match | ~25% filled |
| Migraine - Migraine headache | Low match | ~25% filled |
| Face trauma - Face contusion | Low match | ~20% filled |

## Specialties Mapping
- Family Medicine - High match (for tension headache)

## Key Data Points to Extract

For building our own database, we need:

### 1. Symptoms Database
- Primary symptoms (headache, chest pain, fever, etc.)
- Related/sub-symptoms (headache at temples, headache due to stress, etc.)
- Body region mapping

### 2. Questions Database  
- Question text
- Question type (yes/no, scale, choice, duration)
- Trigger conditions (when to show)
- Answer options

### 3. Conditions Database
- Condition name
- Alternative names (Migraine - Migraine headache)
- Description
- Urgency level
- Prevalence
- Severity
- Warning signs
- Self-care tips
- Related symptoms (weighted)
- Recommended specialty

### 4. Specialties Database
- Specialty name
- Conditions treated
- Match scoring logic


## Dictionary Data Scraped

### Diseases Database
- **Total diseases**: 280+ conditions scraped
- **Categories**: A-Z alphabetical organization
- **Includes**: Adult and Pediatric (PEDS) variants
- **Coverage**: Emergency conditions, chronic diseases, mental health, skin conditions, infections, cancers, injuries

### Symptoms Database  
- **Total symptoms**: 350+ symptoms scraped (partial - full dictionary has 1000+)
- **Categories**: A-Z alphabetical organization
- **Detail level**: Very specific symptom descriptions
- **Body systems covered**: All major systems

### Data Files Created
- `/data/mediktor-diseases.json` - 280 diseases
- `/data/mediktor-symptoms.json` - 350+ symptoms
