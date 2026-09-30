/* Invented sample data for NEXT_PUBLIC_DEMO_MODE. All names and emails are fictional (example.com). ASCII only. */
import { inSegment, mapProfile, signupsByDay, type AppUser, type BugRow, type EmailRow, type FeedbackRow, type ProfileRow, type Segment, type SentryRow } from "./format";
import { DEMO_ADMIN_EMAIL, makeIsoDaysAgo } from "./demo";

/* ---------- Users ---------- */
const NAMES = [
  "alex.petlover", "jordan.walker", "sam.rivera", "casey.morgan", "riley.chen", "taylor.brooks", "morgan.patel", "jamie.ortiz",
  "avery.nguyen", "quinn.foster", "drew.hughes", "blake.sanders", "reese.coleman", "skyler.diaz", "parker.bell", "emery.ward",
  "rowan.price", "harper.gray", "logan.reed", "finley.cook", "dakota.perry", "sage.howard", "kai.jenkins", "remy.powell",
  "ellis.long", "tatum.russell", "river.barnes", "phoenix.ross", "lane.henderson", "marlow.coleman", "shiloh.butler", "arden.simmons",
  "noel.foster", "hollis.bryant", "briar.alexander", "wren.griffin", "oakley.hayes", "sutton.myers", "lennox.ford", "jules.hamilton",
  "campbell.graham", "rory.sullivan", "devon.wallace", "micah.west",
];

// Newest signups first; the first few land inside the last 7 days so the weekly chart has shape.
const RECENT_OFFSETS = [0.1, 0.4, 1.2, 1.5, 1.9, 2.3, 2.8, 3.4, 3.6, 4.5, 5.2, 5.9, 6.4];

const profileRows: ProfileRow[] = NAMES.map((n, i) => {
  const founding = i % 7 === 3;
  const paid = !founding && i % 3 === 0;
  const age = i < RECENT_OFFSETS.length ? RECENT_OFFSETS[i] : 7 + (i - RECENT_OFFSETS.length) * 6.5 + (i % 4) * 0.3;
  return {
    id: `demo-user-${String(i + 1).padStart(2, "0")}`,
    email: `${n}@example.com`,
    subscription_status: founding ? "pro" : paid ? (i % 2 ? "pro" : "family") : "free",
    founding_member: founding,
    created_at: makeIsoDaysAgo(age),
    deleted_at: null,
  };
});

export const demoUsers: AppUser[] = profileRows.map(mapProfile);

/* ---------- Feedback ---------- */
const fb = (i: number, r: Partial<FeedbackRow> & { days: number }): FeedbackRow => {
  const { days, ...rest } = r;
  return {
    id: `demo-fb-${i}`,
    user_email: `${NAMES[i % NAMES.length]}@example.com`,
    rating: null,
    category: "general",
    message: null,
    what_broke: null,
    whats_missing: null,
    used_most: null,
    follow_up_email: null,
    app_version: "1.4.2",
    created_at: makeIsoDaysAgo(days),
    ...rest,
  };
};

export const demoFeedback: FeedbackRow[] = [
  fb(0, { days: 0.3, rating: 5, category: "general", message: "Love the meal planner. My beagle's portions finally make sense.", app_version: "1.4.2" }),
  fb(1, { days: 0.9, rating: 2, category: "bug", what_broke: "Weight log crashes when I add a second pet", used_most: ["Weight log", "Feeding schedule"], app_version: "1.4.2" }),
  fb(2, { days: 1.4, rating: 4, category: "feature_request", whats_missing: "Vet appointment reminders with calendar sync", used_most: ["Vet records"], app_version: "1.4.1" }),
  fb(3, { days: 2.1, rating: 5, category: "general", message: "The food recall alerts are a lifesaver. Thank you!", app_version: "1.4.2" }),
  fb(4, { days: 2.6, rating: 3, category: "feature_request", message: "Would love a family plan where my partner can log walks too.", app_version: "1.4.1" }),
  fb(5, { days: 3.2, rating: 1, category: "bug", message: "Push notifications stopped after the last update. Missed two feeding reminders.", app_version: "1.4.2" }),
  fb(6, { days: 4.0, rating: 4, category: "general", used_most: ["Feeding schedule", "Treat tracker"], whats_missing: "Dark mode for the evening feed", app_version: "1.4.1" }),
  fb(7, { days: 4.8, rating: 5, category: "general", message: "Switched my cat to the recommended diet and her coat is shinier already.", app_version: "1.4.0" }),
  fb(8, { days: 5.5, rating: 2, category: "bug", what_broke: "Barcode scanner cannot read cat food cans", whats_missing: "Manual entry fallback", app_version: "1.4.1" }),
  fb(9, { days: 6.3, rating: 4, category: "feature_request", message: "Please add rabbits and guinea pigs. We have a whole zoo at home.", app_version: "1.4.0" }),
  fb(10, { days: 7.9, rating: 3, category: "general", message: "Onboarding asks for too much before showing any value.", app_version: "1.4.0" }),
  fb(11, { days: 9.1, rating: 5, category: "general", used_most: ["Calorie calculator", "Weight log"], app_version: "1.4.0" }),
  fb(12, { days: 11.4, rating: 1, category: "bug", message: "Subscription shows free after I paid. Please help.", follow_up_email: "support.needed@example.com", app_version: "1.3.9" }),
  fb(13, { days: 13.0, rating: 4, category: "feature_request", whats_missing: "Export feeding history as PDF for my vet", used_most: ["Vet records", "Weight log"], app_version: "1.3.9" }),
  fb(14, { days: 15.6, rating: 3, category: "general", message: "Good app, but the treat tracker is hard to find.", app_version: "1.3.9" }),
  fb(15, { days: 18.2, rating: 5, category: "general", message: "Reminders keep my senior dog's medication on schedule.", app_version: "1.3.8" }),
  fb(16, { days: 21.7, rating: 2, category: "bug", what_broke: "App freezes for a few seconds when opening the food database", app_version: "1.3.8" }),
  fb(17, { days: 26.3, rating: 4, category: "feature_request", message: "Widget for the home screen showing the next meal time.", app_version: "1.3.8" }),
  fb(18, { days: 31.0, rating: 5, category: "general", used_most: ["Feeding schedule"], message: "Simple and calm. Exactly what I wanted.", app_version: "1.3.7" }),
  fb(19, { days: 38.5, rating: 3, category: "general", whats_missing: "Multi-language support (Spanish please)", app_version: "1.3.7" }),
];

/* ---------- Support emails ---------- */
const mail = (i: number, e: Partial<EmailRow> & { days: number }): EmailRow => {
  const { days, ...rest } = e;
  return {
    id: `demo-mail-${i}`,
    from_email: null,
    from_name: null,
    subject: null,
    body: null,
    ai_reply: null,
    status: "unread",
    received_at: makeIsoDaysAgo(days),
    replied_at: null,
    ...rest,
  };
};

export const demoEmails: EmailRow[] = [
  mail(0, { days: 0.2, from_name: "Alex Petlover", from_email: "alex.petlover@example.com", subject: "Portion size for my 9 week old puppy", body: "Hi team,\n\nWe just adopted a golden retriever puppy. The app suggests 3 meals a day but our breeder said 4. Which one should we follow?\n\nThanks,\nAlex", status: "unread" }),
  mail(1, { days: 0.7, from_name: "Jordan Walker", from_email: "jordan.walker@example.com", subject: "Cannot restore my subscription", body: "I reinstalled the app on my new phone and it says I'm on the free plan. I'm pretty sure I paid for the family plan last month.", status: "unread" }),
  mail(2, { days: 1.3, from_name: "Sam Rivera", from_email: "sam.rivera@example.com", subject: "Is the new kibble safe for cats with kidney issues?", body: "My cat was diagnosed with early stage kidney disease. Does your food database flag phosphorus levels?", status: "unread" }),
  mail(3, { days: 2.2, from_name: "Casey Morgan", from_email: "casey.morgan@example.com", subject: "Feature idea: multiple households", body: "My parents and I share care of our lab. Can two accounts see the same pet profile?", status: "read" }),
  mail(4, { days: 3.1, from_name: "Riley Chen", from_email: "riley.chen@example.com", subject: "Feeding reminders arrive late", body: "Reminders for the 7am meal show up around 7:40. Android, app version 1.4.2.", status: "read" }),
  mail(5, { days: 4.4, from_name: "Taylor Brooks", from_email: "taylor.brooks@example.com", subject: "Thank you!", body: "Just wanted to say the weight tracking graph helped my vet spot a trend early. Great work.", status: "replied", replied_at: makeIsoDaysAgo(4.0), ai_reply: "Hi Taylor,\n\nThank you so much for the kind words - we are thrilled the weight graph helped you and your vet.\n\nThe PetKira Team" }),
  mail(6, { days: 5.6, from_name: "Morgan Patel", from_email: "morgan.patel@example.com", subject: "Delete my data", body: "Please delete my account and all pet records. I am moving to a different app.", status: "replied", replied_at: makeIsoDaysAgo(5.1), ai_reply: "Hi Morgan,\n\nWe are sorry to see you go. Your account deletion request has been processed and your data will be removed within 30 days.\n\nThe PetKira Team" }),
  mail(7, { days: 6.8, from_name: "Jamie Ortiz", from_email: "jamie.ortiz@example.com", subject: "Barcode scanner not working on cans", body: "The scanner works on dry food bags but never on wet food cans. Tried good lighting too.", status: "read" }),
  mail(8, { days: 9.0, from_name: "Avery Nguyen", from_email: "avery.nguyen@example.com", subject: "Question about founding member pricing", body: "Is the founding member price locked in for life, or only the first year?", status: "replied", replied_at: makeIsoDaysAgo(8.6), ai_reply: "Hi Avery,\n\nFounding member pricing is locked in for as long as your subscription stays active.\n\nThe PetKira Team" }),
  mail(9, { days: 12.5, from_name: "Quinn Foster", from_email: "quinn.foster@example.com", subject: "Old feature request - vet export", body: "Following up on my earlier idea about exporting a PDF for the vet.", status: "archived" }),
  mail(10, { days: 17.2, from_name: "Drew Hughes", from_email: "drew.hughes@example.com", subject: "Invoice copy for my records", body: "Could you send me a copy of last month's receipt?", status: "archived" }),
  mail(11, { days: 23.9, from_name: "Blake Sanders", from_email: "blake.sanders@example.com", subject: "Do you support reptiles?", body: "I have a bearded dragon and a ball python. Any plans to add exotic pets?", status: "archived" }),
  mail(12, { days: 0.05, from_name: "Reese Coleman", from_email: "reese.coleman@example.com", subject: "Grain-free diet question", body: "Is grain-free still recommended for small breed dogs? The app tip seems outdated.", status: "unread" }),
];

export const demoSupportDraft =
  "Hi there,\n\nThanks for reaching out, and congratulations on your new family member!\n\nFor young puppies, many breeders and vets recommend three to four small meals a day, so both suggestions are reasonable. Please follow your vet's guidance for your dog's exact age and weight; you can change the meal count in the feeding schedule and the app will split the daily portion for you.\n\nIf you would like, send us a note with your pet's weight and we will walk through the numbers together.\n\nWarm regards,\nThe PetKira Team";

/* ---------- Bugs ---------- */
const bug = (i: number, b: Partial<BugRow> & { days: number }): BugRow => {
  const { days, ...rest } = b;
  return {
    id: `demo-bug-${i}`,
    title: null,
    error_message: null,
    stack_trace: null,
    affected_count: 0,
    ai_diagnosis: null,
    status: "new",
    created_at: makeIsoDaysAgo(days),
    fixed_at: null,
    ...rest,
  };
};

export const demoBugs: BugRow[] = [
  bug(0, { days: 0.8, title: "Weight log crashes when adding a second pet", error_message: "TypeError: Cannot read property 'id' of undefined", stack_trace: "TypeError: Cannot read property 'id' of undefined\n    at WeightLogScreen (WeightLogScreen.tsx:88:21)\n    at renderWithHooks (react-native.js:4120)\n    at updateFunctionComponent (react-native.js:5312)", affected_count: 14, ai_diagnosis: "The selected pet id is not reset when a new pet is created, so the screen reads a stale pet object. Guard the lookup and default to the first pet.", status: "new" }),
  bug(1, { days: 2.9, title: "Push reminders stop after update 1.4.2", error_message: "Notification channel 'feeding-reminders' not found", stack_trace: "Error: Notification channel 'feeding-reminders' not found\n    at scheduleReminder (reminders.ts:41:11)\n    at syncSchedules (scheduleSync.ts:19:5)", affected_count: 31, ai_diagnosis: "The notification channel is created only on first install. Recreate the channel on app start so upgraded installs keep working.", status: "in_progress" }),
  bug(2, { days: 4.1, title: "Barcode scanner fails on cylindrical cans", error_message: "Scan timeout after 10000ms", stack_trace: "Error: Scan timeout after 10000ms\n    at BarcodeScanner.onTimeout (BarcodeScanner.tsx:132:15)", affected_count: 9, ai_diagnosis: "Curved labels distort the code. Add a manual entry fallback and lower the focus distance on Android.", status: "new" }),
  bug(3, { days: 6.0, title: "Subscription shows free after purchase", error_message: "CustomerInfo entitlement 'pro' missing", stack_trace: "Error: CustomerInfo entitlement 'pro' missing\n    at refreshEntitlements (purchases.ts:77:9)\n    at AppProvider (AppProvider.tsx:54:7)", affected_count: 6, ai_diagnosis: "Entitlements are read before the purchase identity sync completes. Await logIn before reading CustomerInfo.", status: "in_progress" }),
  bug(4, { days: 8.4, title: "Food database freezes on open", error_message: "JS thread blocked for 2400ms", stack_trace: "Warning: JS thread blocked for 2400ms\n    at FoodListScreen (FoodListScreen.tsx:203:3)\n    at FlatList (react-native.js:9981)", affected_count: 22, ai_diagnosis: "The list renders 4,000 rows at once. Enable windowing and memoize row components.", status: "fixed", fixed_at: makeIsoDaysAgo(3.2) }),
  bug(5, { days: 10.7, title: "Dark mode text unreadable on treat tracker", error_message: "", stack_trace: "", affected_count: 4, ai_diagnosis: "Hard coded #222 text color ignores the theme. Use the themed text token.", status: "fixed", fixed_at: makeIsoDaysAgo(6.5) }),
  bug(6, { days: 13.2, title: "Vet record photo upload never finishes", error_message: "Network request failed", stack_trace: "TypeError: Network request failed\n    at uploadPhoto (storage.ts:58:13)\n    at VetRecordForm.onSubmit (VetRecordForm.tsx:120:9)", affected_count: 11, ai_diagnosis: "Large images exceed the upload size limit. Compress before upload and show progress.", status: "notified", fixed_at: makeIsoDaysAgo(9.0) }),
  bug(7, { days: 15.9, title: "Calorie calculator rounds kittens to zero", error_message: "NaN displayed for daily kcal", stack_trace: "Error: Invalid weight input\n    at calcDailyKcal (calories.ts:26:11)", affected_count: 3, ai_diagnosis: "Weights under 1 kg hit a divide by zero in the life stage factor. Clamp the minimum.", status: "fixed", fixed_at: makeIsoDaysAgo(12.0) }),
  bug(8, { days: 19.4, title: "Language picker resets on restart", error_message: "AsyncStorage key 'locale' undefined", stack_trace: "Warning: AsyncStorage key 'locale' undefined\n    at loadLocale (i18n.ts:33:7)", affected_count: 7, ai_diagnosis: "Locale is stored under a renamed key. Migrate the old key on launch.", status: "notified", fixed_at: makeIsoDaysAgo(15.0) }),
  bug(9, { days: 24.0, title: "Duplicate feeding entries after offline sync", error_message: "Unique constraint violated: feedings_pkey", stack_trace: "PostgrestError: duplicate key value violates unique constraint 'feedings_pkey'\n    at syncQueue (offlineQueue.ts:94:15)", affected_count: 18, ai_diagnosis: "Retries reuse local ids without idempotency. Use client generated UUIDs with upsert.", status: "fixed", fixed_at: makeIsoDaysAgo(18.0) }),
  bug(10, { days: 0.3, title: "Crash opening Settings on iOS 15", error_message: "Invariant Violation: requireNativeComponent", stack_trace: "Invariant Violation: requireNativeComponent: 'RNCSafeAreaView' was not found\n    at SettingsScreen (SettingsScreen.tsx:12:1)", affected_count: 2, ai_diagnosis: null, status: "new" }),
];

/* ---------- Sentry ---------- */
const sentry = (i: number, s: Partial<SentryRow> & { days: number }): SentryRow => {
  const { days, ...rest } = s;
  return {
    id: `demo-sentry-${i}`,
    sentry_issue_id: String(4800100 + i),
    title: null,
    culprit: null,
    level: "error",
    status: "unresolved",
    action: "created",
    platform: "react-native",
    first_seen: makeIsoDaysAgo(days + 2),
    last_seen: makeIsoDaysAgo(days),
    times_seen: 1,
    permalink: `https://sentry.example.com/organizations/petkira-demo/issues/${4800100 + i}/`,
    received_at: makeIsoDaysAgo(days),
    ...rest,
  };
};

export const demoSentry: SentryRow[] = [
  sentry(0, { days: 0.2, title: "WatchdogTermination: app was terminated by the OS", culprit: "AppDelegate", level: "fatal", times_seen: 27, action: "created" }),
  sentry(1, { days: 0.6, title: "TypeError: Cannot read property 'id' of undefined", culprit: "WeightLogScreen", level: "error", times_seen: 41, action: "assigned" }),
  sentry(2, { days: 1.1, title: "App Hanging: ANR for at least 2000 ms", culprit: "FoodListScreen", level: "error", times_seen: 15, action: "created" }),
  sentry(3, { days: 2.0, title: "Network request timeout: GET /rest/v1/feedings", culprit: "syncQueue", level: "warning", times_seen: 88, action: "created" }),
  sentry(4, { days: 3.3, title: "RevenueCat: CustomerInfo identity mismatch", culprit: "purchases.refreshEntitlements", level: "error", times_seen: 12, action: "assigned" }),
  sentry(5, { days: 5.0, title: "Invalid feedback URL: undefined", culprit: "DashboardScreen", level: "warning", times_seen: 6, status: "resolved", action: "resolved" }),
  sentry(6, { days: 6.4, title: "Null pointer: pet.photoUri is null", culprit: "PetCard", level: "error", times_seen: 9, status: "resolved", action: "resolved" }),
  sentry(7, { days: 8.8, title: "Warning: Each child in a list should have a unique key", culprit: "TreatList", level: "warning", times_seen: 233, status: "ignored", action: "ignored" }),
  sentry(8, { days: 11.0, title: "WatchdogTermination during background sync", culprit: "BackgroundSyncTask", level: "fatal", times_seen: 4, status: "resolved", action: "resolved" }),
  sentry(9, { days: 14.5, title: "Unhandled promise rejection: storage quota exceeded", culprit: "photoCache", level: "error", times_seen: 3, status: "ignored", action: "ignored" }),
  sentry(10, { days: 0.1, title: "ANR: main thread blocked during onboarding", culprit: "OnboardingFlow", level: "warning", times_seen: 2, action: "created" }),
];

/* ---------- Analytics ---------- */
export const demoActivitySummary = { users_today: 187, users_7d: 642, events_today: 3914 };

const DAU = [142, 151, 138, 160, 173, 169, 181, 164, 158, 176, 190, 184, 179, 187];
// Live query returns newest first.
export const demoDau = DAU.map((active_users, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (DAU.length - 1 - i));
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { day, active_users };
}).reverse();

export const demoFeaturePopularity = [
  { event_name: "feeding_logged", total_uses: 5210, unique_users: 402 },
  { event_name: "weight_entry_added", total_uses: 2984, unique_users: 318 },
  { event_name: "food_database_search", total_uses: 2411, unique_users: 290 },
  { event_name: "reminder_created", total_uses: 1760, unique_users: 244 },
  { event_name: "treat_logged", total_uses: 1322, unique_users: 201 },
  { event_name: "vet_record_added", total_uses: 874, unique_users: 163 },
  { event_name: "barcode_scanned", total_uses: 640, unique_users: 121 },
  { event_name: "recall_alert_opened", total_uses: 455, unique_users: 98 },
  { event_name: "pet_profile_created", total_uses: 311, unique_users: 92 },
  { event_name: "paywall_viewed", total_uses: 268, unique_users: 77 },
];

const EVENT_TEMPLATES = [
  { event_name: "feeding_logged", event_category: "feature", screen_name: "Home", platform: "ios" },
  { event_name: "screen_viewed", event_category: "navigation", screen_name: "WeightLog", platform: "android" },
  { event_name: "weight_entry_added", event_category: "feature", screen_name: "WeightLog", platform: "ios" },
  { event_name: "food_database_search", event_category: "feature", screen_name: "FoodList", platform: "android" },
  { event_name: "reminder_created", event_category: "feature", screen_name: "Reminders", platform: "ios" },
  { event_name: "paywall_viewed", event_category: "monetization", screen_name: "Paywall", platform: "ios" },
  { event_name: "treat_logged", event_category: "feature", screen_name: "TreatTracker", platform: "android" },
  { event_name: "barcode_scanned", event_category: "feature", screen_name: "Scanner", platform: "android" },
  { event_name: "app_opened", event_category: "session", screen_name: "Splash", platform: "ios" },
  { event_name: "vet_record_added", event_category: "feature", screen_name: "VetRecords", platform: "ios" },
];

export const demoEvents = Array.from({ length: 25 }, (_, i) => ({
  ...EVENT_TEMPLATES[(i * 7) % EVENT_TEMPLATES.length],
  created_at: makeIsoDaysAgo((i * 11 + 2) / 1440),
}));

/* ---------- App health ---------- */
export function demoHealth() {
  const total = demoUsers.length;
  const trials = demoUsers.filter((u) => u.status === "trial").length;
  const founding = demoUsers.filter((u) => u.is_founding).length;
  const openBugs = demoBugs.filter((b) => b.status === "new" || b.status === "in_progress").length;
  const unreadMail = demoEmails.filter((e) => e.status === "unread");
  const week = signupsByDay(demoUsers, 7);
  const activity = [
    ...demoUsers.slice(0, 4).map((u) => ({ icon: "+", event: "New signup", detail: u.email, time: u.created_at as string })),
    ...demoBugs.filter((b) => b.status === "new").slice(0, 3).map((b) => ({ icon: "!", event: "New bug reported", detail: b.title ?? "(untitled)", time: b.created_at as string })),
    ...unreadMail.slice(0, 3).map((m) => ({ icon: "@", event: "Support email", detail: `${m.from_email} - ${m.subject}`, time: m.received_at as string })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);
  return { total, trials, paid: total - trials, founding, openBugs, unread: unreadMail.length, weekLabels: week.labels, weekValues: week.values, activity };
}

/* ---------- Admins ---------- */
export const demoAdmins: Record<string, unknown>[] = [
  { email: DEMO_ADMIN_EMAIL, user_id: "demo-admin", created_at: makeIsoDaysAgo(120) },
  { email: "ops.lead@example.com", user_id: "demo-admin-2", created_at: makeIsoDaysAgo(64) },
  { email: "support.agent@example.com", user_id: "demo-admin-3", created_at: makeIsoDaysAgo(21) },
];

/* ---------- Broadcast ---------- */
export function demoSegmentCount(seg: Segment): number {
  return demoUsers.filter((u) => u.email && inSegment(u, seg)).length;
}
export const demoSegmentCounts: Record<Segment, number> = {
  all: demoSegmentCount("all"),
  free: demoSegmentCount("free"),
  paid: demoSegmentCount("paid"),
  founding: demoSegmentCount("founding"),
};

/* ---------- AI analysis ---------- */
export const demoAnalysis = {
  frustrations: [
    "Reminders and push notifications stopped firing after version 1.4.2",
    "Weight log crashes or confuses data when a household has more than one pet",
    "Onboarding asks for too much information before showing value",
  ],
  features: [
    "Shared household access so partners and family can log meals and walks",
    "Vet-ready PDF export of feeding and weight history",
    "Support for small pets such as rabbits and guinea pigs",
  ],
  bugs: [
    "Barcode scanner cannot read curved wet food cans",
    "Subscription status shows free after purchase on new devices",
    "Food database freezes briefly on open",
  ],
  priority: [
    "Fix the notification channel regression affecting upgraded installs",
    "Guard the weight log against stale pet selection",
    "Sync entitlements after purchase identity login",
    "Add manual entry fallback to the barcode scanner",
    "Scope a shared household plan for the next release",
  ],
};
