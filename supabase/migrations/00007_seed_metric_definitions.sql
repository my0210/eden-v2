-- Eden v2 Metric Definitions Seed Data
-- ============================================================
-- All 70+ Primespan metrics organized by domain and sub-domain

-- ============================================================
-- HEART - Cardiovascular System
-- ============================================================

-- Aerobic Capacity
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('heart', 'Aerobic Capacity', 'VO2max', 'How much oxygen your body can use', 'Maximum aerobic capacity — #1 predictor of lifespan', 'ml/kg/min', 'number', '["Apple Watch (auto)", "Garmin/Polar (auto)", "Treadmill test (clinical)", "Cooper test (self)"]', 'monthly', 1),
('heart', 'Aerobic Capacity', 'Zone 2 Capacity', 'How much oxygen your body can use', 'Sustainable aerobic base — foundation for all cardio fitness', 'mins/week', 'number', '["Apple Watch workout mins", "Strava/TrainingPeaks", "Self-log (mins/week)"]', 'weekly', 2);

-- Cardiac Efficiency
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('heart', 'Cardiac Efficiency', 'Resting Heart Rate', 'How efficiently your heart works', 'Heart efficiency at rest — lower is generally better', 'bpm', 'number', '["Apple Watch (auto)", "Oura (auto)", "Whoop (auto)", "Manual morning check"]', 'daily', 3),
('heart', 'Cardiac Efficiency', 'Heart Rate Recovery', 'How efficiently your heart works', 'How fast HR drops after exertion — cardiac fitness marker', 'bpm', 'number', '["Apple Watch post-workout", "Manual (HR drop after 1-2 min)"]', 'weekly', 4),
('heart', 'Cardiac Efficiency', 'HRV', 'How efficiently your heart works', 'Autonomic nervous system balance — recovery and stress indicator', 'ms', 'number', '["Apple Watch (auto)", "Oura (auto)", "Whoop (auto)", "Chest strap + app"]', 'daily', 5),
('heart', 'Cardiac Efficiency', 'Max Heart Rate', 'How efficiently your heart works', 'Cardiovascular ceiling — used to calculate training zones', 'bpm', 'number', '["220-age formula", "Apple Watch max detected", "All-out effort test"]', 'quarterly', 6);

-- Cardiovascular Health
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('heart', 'Cardiovascular Health', 'Blood Pressure', 'Clinical markers of heart disease risk', 'Vascular pressure — major CV risk factor when elevated', 'mmHg', 'text', '["Home BP cuff", "Pharmacy kiosk", "Doctor visit", "Some smartwatches"]', 'weekly', 7),
('heart', 'Cardiovascular Health', 'ApoB', 'Clinical markers of heart disease risk', 'Atherogenic particles — causal driver of heart disease', 'mg/dL', 'number', '["Lab upload (bloodwork, request specifically)"]', 'quarterly', 8),
('heart', 'Cardiovascular Health', 'Lp(a)', 'Clinical markers of heart disease risk', 'Genetic cardiovascular risk — test once, doesn''t change', 'nmol/L', 'number', '["Lab upload (bloodwork, one-time genetic test)"]', 'once', 9),
('heart', 'Cardiovascular Health', 'LDL / HDL', 'Clinical markers of heart disease risk', 'Traditional cholesterol markers — part of CV risk picture', 'mg/dL', 'text', '["Lab upload (standard lipid panel)"]', 'quarterly', 10),
('heart', 'Cardiovascular Health', 'CAC Score', 'Clinical markers of heart disease risk', 'Coronary artery calcium — actual plaque buildup in arteries', 'Agatston', 'number', '["CT scan (cardiac imaging center)"]', 'once', 11);

-- ============================================================
-- FRAME - Musculoskeletal System
-- ============================================================

-- Upper Body Strength
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('frame', 'Upper Body Strength', 'Pushing Strength', 'Pushing and pulling capacity', 'Upper body pushing power — functional for daily activities', 'reps or lbs', 'number', '["Push-up max (self-test)", "Bench press weight", "Dumbbell press weight"]', 'weekly', 12),
('frame', 'Upper Body Strength', 'Pulling Strength', 'Pushing and pulling capacity', 'Upper body pulling power — back strength and posture', 'reps or lbs', 'number', '["Pull-up max (self-test)", "Row weight", "Lat pulldown weight"]', 'weekly', 13);

-- Lower Body Strength
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('frame', 'Lower Body Strength', 'Leg Strength', 'Leg power and endurance', 'Lower body power — predicts functional capacity and fall risk', 'reps or lbs', 'number', '["30-sec sit-to-stand (self-test)", "Squat max weight", "Leg press weight"]', 'weekly', 14),
('frame', 'Lower Body Strength', 'Leg Endurance', 'Leg power and endurance', 'Lower body stamina — muscular endurance under load', 'seconds', 'duration', '["Wall sit time", "Squat hold time", "Bodyweight squat reps"]', 'weekly', 15);

-- Grip Strength
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('frame', 'Grip Strength', 'Grip', 'Hand and forearm power', 'Overall strength proxy — strongest mortality predictor for strength', 'kg', 'number', '["Dynamometer reading (kg)", "Dead hang time", "Farmer carry (weight × time)"]', 'weekly', 16);

-- Stability & Balance
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('frame', 'Stability & Balance', 'Balance', 'Postural control and fall prevention', 'Postural stability — predicts fall risk and mortality in older adults', 'seconds', 'duration', '["Single-leg stand eyes closed", "Single-leg stand eyes open", "Balance board time"]', 'weekly', 17),
('frame', 'Stability & Balance', 'Core Stability', 'Postural control and fall prevention', 'Trunk control — foundation for all movement and injury prevention', 'seconds', 'duration', '["Plank hold time", "Side plank time", "Dead bug reps"]', 'weekly', 18);

-- Body Composition
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('frame', 'Body Composition', 'Body Fat %', 'What your body is made of', 'Fat mass relative to total — metabolic health indicator', '%', 'number', '["Photo AI analysis", "Smart scale", "DEXA scan", "Calipers", "Navy method"]', 'weekly', 19),
('frame', 'Body Composition', 'Lean Mass', 'What your body is made of', 'Muscle and bone mass — protective tissue for longevity', 'lbs', 'number', '["Smart scale estimate", "DEXA scan", "Photo AI progress"]', 'weekly', 20),
('frame', 'Body Composition', 'Waist', 'What your body is made of', 'Visceral fat proxy — central obesity is high-risk', 'inches', 'number', '["Photo AI analysis", "Tape measure at navel"]', 'weekly', 21),
('frame', 'Body Composition', 'Weight', 'What your body is made of', 'Total body mass — trend matters more than absolute number', 'lbs', 'number', '["Apple Health (auto from scale)", "Smart scale", "Manual input"]', 'daily', 22),
('frame', 'Body Composition', 'Waist-to-Hip Ratio', 'What your body is made of', 'Fat distribution pattern — apple vs pear shape risk', 'ratio', 'number', '["Photo AI", "Tape measure (calculated)"]', 'weekly', 23);

-- Mobility & Flexibility
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('frame', 'Mobility & Flexibility', 'Overall Mobility', 'Range of motion and movement quality', 'Functional range of motion — can you move well through full ROM?', 'score', 'scale_1_10', '["Video AI movement assessment", "FMS screen (pro)", "Self-assessment (1-10)"]', 'weekly', 24),
('frame', 'Mobility & Flexibility', 'Hip Mobility', 'Range of motion and movement quality', 'Hip joint freedom — critical for lower body function', 'score', 'scale_1_10', '["Deep squat hold test", "Video AI", "90/90 position test"]', 'weekly', 25),
('frame', 'Mobility & Flexibility', 'Shoulder Mobility', 'Range of motion and movement quality', 'Shoulder joint freedom — affects overhead and pulling movements', 'score', 'scale_1_10', '["Reach-behind test", "Video AI", "Shoulder rotation test"]', 'weekly', 26),
('frame', 'Mobility & Flexibility', 'Hamstring Flexibility', 'Range of motion and movement quality', 'Posterior chain length — affects back health and hip function', 'inches', 'number', '["Sit-and-reach test", "Toe touch (photo)", "Straight leg raise"]', 'weekly', 27);

-- Structural Health
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('frame', 'Structural Health', 'Posture', 'Skeletal integrity and alignment', 'Spinal alignment — affects pain, breathing, and movement', 'score', 'scale_1_10', '["Photo AI side profile", "Mirror self-check", "Physio assessment"]', 'weekly', 28),
('frame', 'Structural Health', 'Joint Pain', 'Skeletal integrity and alignment', 'Structural wear signal — early warning for intervention', 'score', 'scale_1_10', '["Self-report (0-10 per joint)", "Pain questionnaire"]', 'daily', 29),
('frame', 'Structural Health', 'Bone Density', 'Skeletal integrity and alignment', 'Skeletal strength — fracture risk, especially important 40+', 'T-score', 'number', '["DEXA scan (clinical)"]', 'quarterly', 30);

-- ============================================================
-- MIND - Cognitive System
-- ============================================================

-- Attention & Focus
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('mind', 'Attention & Focus', 'Focus Duration', 'Ability to direct and sustain attention', 'Sustained attention span — how long before distraction', 'minutes', 'number', '["Focus timer apps (Forest, etc.)", "iOS Focus Mode time", "Self-estimate"]', 'daily', 31),
('mind', 'Attention & Focus', 'Deep Work Hours', 'Ability to direct and sustain attention', 'Uninterrupted cognitive work — high-value output time', 'hours', 'number', '["Calendar analysis", "Time tracker (Toggl, RescueTime)", "Self-report"]', 'daily', 32),
('mind', 'Attention & Focus', 'Flow States', 'Ability to direct and sustain attention', 'Peak focus experiences — when time disappears in work', 'count', 'number', '["Self-report (count per week)", "Flow journal"]', 'weekly', 33);

-- Digital Behavior
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('mind', 'Digital Behavior', 'Screen Time', 'Relationship with devices and apps', 'Total daily screen exposure — quantity of digital time', 'hours', 'number', '["iOS Screen Time (auto)", "Android Digital Wellbeing (auto)"]', 'daily', 34),
('mind', 'Digital Behavior', 'Phone Pickups', 'Relationship with devices and apps', 'Compulsive checking frequency — attention fragmentation', 'count', 'number', '["iOS Screen Time (auto)", "Android Digital Wellbeing (auto)"]', 'daily', 35),
('mind', 'Digital Behavior', 'Social Media Time', 'Relationship with devices and apps', 'High-distraction app usage — dopamine-driven scrolling', 'hours', 'number', '["iOS Screen Time by app", "Android Digital Wellbeing"]', 'daily', 36),
('mind', 'Digital Behavior', 'Notifications', 'Relationship with devices and apps', 'External interruptions — forced attention breaks', 'count', 'number', '["iOS Screen Time (auto)", "Notification audit (manual)"]', 'daily', 37);

-- Mental Practices
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('mind', 'Mental Practices', 'Mindful Minutes', 'Intentional cognitive training', 'Time in meditation/breathwork — attention training', 'minutes', 'number', '["Apple Health Mindful Minutes (auto)", "Headspace/Calm stats", "Manual log"]', 'daily', 38),
('mind', 'Mental Practices', 'Reading Time', 'Intentional cognitive training', 'Deep, sustained reading — focused cognitive engagement', 'minutes', 'number', '["Kindle stats", "Apple Books", "Self-report (mins/day)"]', 'daily', 39),
('mind', 'Mental Practices', 'Learning Time', 'Intentional cognitive training', 'Active skill acquisition — brain plasticity maintenance', 'minutes', 'number', '["Course platform stats", "Duolingo/etc.", "Self-report"]', 'daily', 40),
('mind', 'Mental Practices', 'Journaling', 'Intentional cognitive training', 'Reflective practice — self-awareness and processing', 'days/week', 'number', '["Self-report (days/week)", "Day One stats", "Journal app"]', 'weekly', 41);

-- Stress & Emotional
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('mind', 'Stress & Emotional', 'Perceived Stress', 'Mental and emotional state', 'Subjective stress load — how overwhelmed you feel', 'score', 'scale_1_10', '["Quick check-in (1-10)", "PSS-10 questionnaire (validated)"]', 'daily', 42),
('mind', 'Stress & Emotional', 'Anxiety', 'Mental and emotional state', 'Worry and tension level — impacts focus and sleep', 'score', 'scale_1_10', '["Quick check-in (1-10)", "GAD-7 questionnaire (validated)"]', 'daily', 43),
('mind', 'Stress & Emotional', 'Mood', 'Mental and emotional state', 'Emotional state — affects motivation and decision-making', 'score', 'scale_1_10', '["Quick check-in (1-10)", "Mood tracker app", "Daylio"]', 'daily', 44),
('mind', 'Stress & Emotional', 'Resilience', 'Mental and emotional state', 'Bounce-back capacity — recovery from setbacks', 'score', 'scale_1_10', '["Brief Resilience Scale (BRS questionnaire)"]', 'monthly', 45);

-- Cognitive Performance
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('mind', 'Cognitive Performance', 'Reaction Time', 'Brain processing capabilities', 'Neural processing speed — how fast brain responds', 'ms', 'number', '["Online reaction test", "Cognitive app", "Gaming benchmark"]', 'weekly', 46),
('mind', 'Cognitive Performance', 'Working Memory', 'Brain processing capabilities', 'Mental holding capacity — juggling information in mind', 'score', 'number', '["N-back test app", "Digit span test", "Cambridge Brain Sciences"]', 'weekly', 47),
('mind', 'Cognitive Performance', 'Processing Speed', 'Brain processing capabilities', 'How fast you think — speed of cognitive operations', 'score', 'number', '["Cognitive test apps", "Trail Making Test", "Pattern matching"]', 'weekly', 48);

-- ============================================================
-- METABOLISM - Metabolic System
-- ============================================================

-- Glucose Regulation
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('metabolism', 'Glucose Regulation', 'Fasting Glucose', 'Blood sugar control and stability', 'Baseline blood sugar — early diabetes warning', 'mg/dL', 'number', '["Lab upload (bloodwork)", "Home glucose meter", "CGM"]', 'weekly', 49),
('metabolism', 'Glucose Regulation', 'HbA1c', 'Blood sugar control and stability', '3-month glucose average — gold standard for glucose control', '%', 'number', '["Lab upload (bloodwork)"]', 'quarterly', 50),
('metabolism', 'Glucose Regulation', 'Glucose Variability', 'Blood sugar control and stability', 'Blood sugar stability — spikes and crashes pattern', 'mg/dL', 'number', '["CGM (Levels, Libre, Dexcom)"]', 'daily', 51),
('metabolism', 'Glucose Regulation', 'Post-Meal Response', 'Blood sugar control and stability', 'How food affects blood sugar — glycemic impact', 'mg/dL', 'number', '["CGM", "Finger prick 1-2h after meals"]', 'daily', 52),
('metabolism', 'Glucose Regulation', 'Fasting Insulin', 'Blood sugar control and stability', 'Insulin baseline — often elevated before glucose rises', 'µIU/mL', 'number', '["Lab upload (bloodwork, request specifically)"]', 'quarterly', 53),
('metabolism', 'Glucose Regulation', 'HOMA-IR', 'Blood sugar control and stability', 'Insulin resistance score — metabolic dysfunction marker', 'score', 'number', '["Calculated (from fasting glucose + insulin)"]', 'quarterly', 54);

-- Energy & Nutrition
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('metabolism', 'Energy & Nutrition', 'Energy Stability', 'Fuel input and energy output', 'Crashes vs steady energy — how fuel affects function', 'score', 'scale_1_10', '["Self-report (1-10)", "Energy journal", "CGM correlation"]', 'daily', 55),
('metabolism', 'Energy & Nutrition', 'Protein Intake', 'Fuel input and energy output', 'Protein sufficiency — muscle maintenance fuel', 'grams', 'number', '["Food tracker (MyFitnessPal, Cronometer)", "Simple Y/N target check"]', 'daily', 56),
('metabolism', 'Energy & Nutrition', 'Fiber Intake', 'Fuel input and energy output', 'Fiber adequacy — gut health and glucose response', 'grams', 'number', '["Food tracker", "Simple Y/N target check"]', 'daily', 57),
('metabolism', 'Energy & Nutrition', 'Hydration', 'Fuel input and energy output', 'Fluid balance — affects energy, cognition, performance', 'score', 'scale_1_10', '["Self-report", "Water tracking app", "Urine color check"]', 'daily', 58);

-- Metabolic Health Markers
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('metabolism', 'Metabolic Health Markers', 'Triglycerides', 'Lab indicators of metabolic function', 'Blood fats — elevated indicates metabolic issues', 'mg/dL', 'number', '["Lab upload (bloodwork, standard lipid panel)"]', 'quarterly', 59),
('metabolism', 'Metabolic Health Markers', 'HDL', 'Lab indicators of metabolic function', '"Good" cholesterol — higher is protective', 'mg/dL', 'number', '["Lab upload (bloodwork, standard lipid panel)"]', 'quarterly', 60),
('metabolism', 'Metabolic Health Markers', 'TG/HDL Ratio', 'Lab indicators of metabolic function', 'Insulin resistance proxy — should be under 2', 'ratio', 'number', '["Calculated from lipid panel"]', 'quarterly', 61),
('metabolism', 'Metabolic Health Markers', 'hsCRP', 'Lab indicators of metabolic function', 'Systemic inflammation — chronic = accelerated aging', 'mg/L', 'number', '["Lab upload (bloodwork, high-sensitivity CRP)"]', 'quarterly', 62),
('metabolism', 'Metabolic Health Markers', 'ALT / AST', 'Lab indicators of metabolic function', 'Liver enzymes — fatty liver and liver stress', 'U/L', 'text', '["Lab upload (bloodwork, liver panel)"]', 'quarterly', 63),
('metabolism', 'Metabolic Health Markers', 'GGT', 'Lab indicators of metabolic function', 'Liver stress marker — sensitive metabolic indicator', 'U/L', 'number', '["Lab upload (bloodwork)"]', 'quarterly', 64),
('metabolism', 'Metabolic Health Markers', 'Uric Acid', 'Lab indicators of metabolic function', 'Metabolic stress — elevated indicates dysfunction', 'mg/dL', 'number', '["Lab upload (bloodwork)"]', 'quarterly', 65);

-- Hormonal Health
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('metabolism', 'Hormonal Health', 'Testosterone', 'Endocrine system function', 'Sex hormone — affects energy, muscle, mood, metabolism', 'ng/dL', 'number', '["Lab upload (bloodwork, morning draw, total + free)"]', 'quarterly', 66),
('metabolism', 'Hormonal Health', 'Thyroid (TSH)', 'Endocrine system function', 'Metabolic regulator — controls energy expenditure', 'mIU/L', 'number', '["Lab upload (bloodwork, thyroid panel)"]', 'quarterly', 67),
('metabolism', 'Hormonal Health', 'DHEA-S', 'Endocrine system function', 'Adrenal reserve — declines with age, vitality marker', 'µg/dL', 'number', '["Lab upload (bloodwork)"]', 'quarterly', 68);

-- ============================================================
-- RECOVERY - Restorative System
-- ============================================================

-- Sleep Quantity
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('recovery', 'Sleep Quantity', 'Sleep Duration', 'How much sleep you get', 'Total hours asleep — most people need 7-9 hours', 'hours', 'number', '["Apple Watch (auto)", "Oura (auto)", "Whoop (auto)", "Manual log"]', 'daily', 69),
('recovery', 'Sleep Quantity', 'Time in Bed', 'How much sleep you get', 'Hours attempting sleep — includes awake time', 'hours', 'number', '["Sleep tracker (auto)", "Manual log"]', 'daily', 70),
('recovery', 'Sleep Quantity', 'Sleep Efficiency', 'How much sleep you get', '% of bed time actually asleep — should be 85%+', '%', 'number', '["Sleep tracker (calculated)", "Duration ÷ Time in bed"]', 'daily', 71);

-- Sleep Quality
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('recovery', 'Sleep Quality', 'Deep Sleep', 'How restorative your sleep is', 'Physical restoration phase — body repair happens here', 'hours', 'number', '["Apple Watch (auto)", "Oura (auto)", "Whoop (auto)"]', 'daily', 72),
('recovery', 'Sleep Quality', 'REM Sleep', 'How restorative your sleep is', 'Cognitive restoration phase — memory consolidation', 'hours', 'number', '["Apple Watch (auto)", "Oura (auto)", "Whoop (auto)"]', 'daily', 73),
('recovery', 'Sleep Quality', 'Sleep Latency', 'How restorative your sleep is', 'Time to fall asleep — should be 10-20 minutes', 'minutes', 'number', '["Sleep tracker", "Self-report (minutes to fall asleep)"]', 'daily', 74),
('recovery', 'Sleep Quality', 'Wake-ups', 'How restorative your sleep is', 'Nighttime awakenings — fragmented sleep is poor sleep', 'count', 'number', '["Sleep tracker (auto)", "Self-report (count)"]', 'daily', 75),
('recovery', 'Sleep Quality', 'Sleep Score', 'How restorative your sleep is', 'Overall sleep quality — single number summary', 'score', 'number', '["Apple Watch", "Oura", "Whoop (proprietary composite)"]', 'daily', 76);

-- Sleep Consistency
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('recovery', 'Sleep Consistency', 'Bedtime Consistency', 'Regularity of sleep schedule', 'Same time each night — circadian rhythm alignment', 'minutes', 'number', '["Sleep tracker (calculated)", "Manual tracking"]', 'weekly', 77),
('recovery', 'Sleep Consistency', 'Wake Time Consistency', 'Regularity of sleep schedule', 'Same time each morning — most important for rhythm', 'minutes', 'number', '["Sleep tracker (calculated)", "Manual tracking"]', 'weekly', 78),
('recovery', 'Sleep Consistency', 'Social Jet Lag', 'Regularity of sleep schedule', 'Weekend schedule shift — like crossing time zones weekly', 'hours', 'number', '["Calculated (weekend vs weekday sleep midpoint)"]', 'weekly', 79);

-- Autonomic Recovery
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('recovery', 'Autonomic Recovery', 'Morning HRV', 'Nervous system restoration', 'Overnight recovery status — did you actually recover?', 'ms', 'number', '["Apple Watch (auto)", "Oura (auto)", "Whoop (auto)", "HRV app"]', 'daily', 80),
('recovery', 'Autonomic Recovery', 'HRV Trend', 'Nervous system restoration', 'Recovery trajectory — rising is good, falling is concern', 'ms', 'number', '["Wearable 7-day or 30-day average"]', 'weekly', 81),
('recovery', 'Autonomic Recovery', 'Resting HR Trend', 'Nervous system restoration', 'Chronic load indicator — rising RHR = overreaching', 'bpm', 'number', '["Wearable trend analysis"]', 'weekly', 82),
('recovery', 'Autonomic Recovery', 'Respiratory Rate', 'Nervous system restoration', 'Overnight breathing — elevated can indicate illness/stress', 'breaths/min', 'number', '["Apple Watch (auto)", "Oura (auto)"]', 'daily', 83);

-- Stress Recovery
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('recovery', 'Stress Recovery', 'Cortisol (morning)', 'Stress hormone regulation', 'Morning cortisol spike — should be high on waking', 'µg/dL', 'number', '["Saliva test (at-home kit: DUTCH, etc.)", "Lab upload"]', 'monthly', 84),
('recovery', 'Stress Recovery', 'Cortisol (evening)', 'Stress hormone regulation', 'Evening cortisol — should be low for good sleep', 'µg/dL', 'number', '["Saliva test (at-home kit)", "Lab upload"]', 'monthly', 85);

-- Subjective Recovery
INSERT INTO metric_definitions (domain, sub_domain, name, description, what_it_tells_you, unit, value_type, measurement_sources, frequency_hint, sort_order) VALUES
('recovery', 'Subjective Recovery', 'Perceived Energy', 'How recovered you feel', 'How rested you feel — subjective recovery signal', 'score', 'scale_1_10', '["Morning check-in (1-10)"]', 'daily', 86),
('recovery', 'Subjective Recovery', 'Readiness', 'How recovered you feel', 'Ready to perform or need rest? — training guidance', 'score', 'scale_1_10', '["Oura/Whoop readiness score", "Self-assessment (1-10)"]', 'daily', 87),
('recovery', 'Subjective Recovery', 'Soreness', 'How recovered you feel', 'Muscular recovery — DOMS and tissue repair status', 'score', 'scale_1_10', '["Self-report (1-10)"]', 'daily', 88),
('recovery', 'Subjective Recovery', 'Motivation', 'How recovered you feel', 'Mental recovery — low motivation can signal overtraining', 'score', 'scale_1_10', '["Self-report (1-10)"]', 'daily', 89);
