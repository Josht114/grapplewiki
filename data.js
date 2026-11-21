// GrappleWiki data
// ---------------------------------------------------------------
// Naming pattern:  [Top|Bottom] [position] ([variation])
// POSITIONS  side = top | bottom | neutral; counterpart = the same position from the other side.
// TECHNIQUES from = starting position, to = where it ends (null = no position change),
//   col:  sub        = a submission
//         transition = moves you from one position to another
//         defense    = stops an opponent's submission or transition without changing position
//   counters = ids of the opponent's techniques this defense stops (shown on both pages)
//   status = complete (green) | draft (yellow)
// CONCEPTS   general principles, not tied to one position.
// LAYOUT     the home page grid.  ALIASES  old page ids that redirect to new ones.
// WANTED     suggested pages that don't exist yet (shown as red links).
// ---------------------------------------------------------------

window.WIKI = {
  positions: [
    // ---- positive / standing ----
    { id: "top-back-take-standing", name: "Top back take (standing)", side: "top", counterpart: "bottom-back-take-standing",
      summary: "You are behind a standing opponent, usually with a seatbelt or body lock. The goal is to bring them down while keeping their back." },
    { id: "top-body-lock", name: "Top body lock (standing)", side: "top", counterpart: "bottom-body-lock",
      summary: "Hands locked around the opponent's waist while standing. Controls their posture and sets up trips and mat returns.",
      steps: [
        "Keep your head tight to their chest or under their chin.",
        "Lock your hands low around the waist (gable or S-grip).",
        "Keep your hips close so they can't sprawl or frame.",
        "Pull their hips into you to break their base."
      ] },
    { id: "top-front-headlock", name: "Top front headlock", side: "top", counterpart: "bottom-front-headlock",
      summary: "You control the opponent's head and one arm from the front while they are bent over or on their knees. A hub for the darce, anaconda, guillotine and go-behinds.",
      steps: [
        "Chin on the back of their head or shoulder.",
        "One arm around the head, the other on the far triceps.",
        "Keep your hips back so they can't shoot under you.",
        "Snap them down, then circle behind or attack the neck."
      ] },

    // ---- positive / post guard ----
    { id: "top-side-control", name: "Top side control", side: "top", counterpart: "bottom-side-control",
      summary: "Chest-to-chest across the opponent with their legs passed. A stable pin and the launch point for mount, knee on belly and shoulder locks." },
    { id: "top-side-control-kesa", name: "Top side control (kesa gatame)", side: "top", counterpart: "bottom-side-control-kesa",
      summary: "Seated beside the opponent, hip to their ribs, arm around their neck and their near arm trapped. A judo-style pin with arm locks and chokes.",
      steps: [
        "Sit hip-to-hip against their ribs, facing their head.",
        "Wrap their head with your near arm.",
        "Trap their near arm under your armpit.",
        "Spread your legs wide for base and keep your head low."
      ] },
    { id: "top-knee-on-belly", name: "Top knee on belly", side: "top", counterpart: "bottom-knee-on-belly",
      summary: "Knee across the opponent's stomach with the other leg posted wide. A mobile pressure position between side control and mount.",
      steps: [
        "Slide your shin across their belly, toes toward the far hip.",
        "Post the far leg wide for base.",
        "Grip the far collar and the near pants or belt.",
        "Ride their movement and step to mount when they push the knee."
      ] },
    { id: "top-mount", name: "Top mount", side: "top", counterpart: "bottom-mount",
      summary: "Sitting on the opponent's torso with knees on the mat. One of the most dominant positions, with chokes and arm attacks available." },
    { id: "top-mount-s", name: "Top mount (S-mount)", side: "top", counterpart: "bottom-mount-s",
      summary: "High mount with one knee up by the opponent's head and the other shin under their shoulder, forming an S. Isolates an arm for the arm bar.",
      steps: [
        "From high mount, step one foot up beside their shoulder.",
        "Slide the other shin under their head or shoulder.",
        "Lean your weight onto their chest.",
        "Isolate the near arm and swing into the arm bar."
      ] },
    { id: "top-mount-technical", name: "Top mount (technical)", side: "top", counterpart: "bottom-mount-technical",
      summary: "Mount variation where the opponent has turned onto their side: one knee behind their back, the other leg posted in front. Follow their turn to take the back or arm bar.",
      steps: [
        "As they turn, slide your knee tight behind their back.",
        "Post the other leg up in front of their face.",
        "Keep the near arm trapped.",
        "Take the back if they keep turning, or arm bar if they turn back."
      ] },
    { id: "top-back-mount", name: "Top back mount", side: "top", counterpart: "bottom-back-mount",
      summary: "Behind the opponent with hooks or a body triangle and a seatbelt grip. The highest-percentage submission position." },
    { id: "top-crucifix", name: "Top crucifix", side: "top", counterpart: "bottom-crucifix",
      summary: "Both of the opponent's arms are trapped, one between your legs and one by your arm, usually from turtle. Their neck is unprotected.",
      steps: [
        "From top turtle, hook their near arm with your legs.",
        "Roll or slide to their side, keeping the arm trapped.",
        "Control their other arm with your own arm.",
        "Attack the neck or extend the trapped arm."
      ] },
    { id: "top-turtle", name: "Top turtle", side: "top", counterpart: "bottom-turtle",
      summary: "Opponent is on hands and knees. Control the hips and head, then attack the back, chokes or a roll." },
    { id: "top-north-south", name: "Top north south", side: "top", counterpart: "bottom-north-south",
      summary: "Chest-to-chest with your head toward the opponent's hips. Strong pressure pin with chokes and kimuras." },

    // ---- neutral / standing ----
    { id: "standing", name: "Standing", side: "neutral",
      summary: "Both athletes on their feet, no one with a dominant grip or angle. Everything starts here: takedowns, guard pulls and grip fighting." },

    // ---- neutral / guard ----
    { id: "top-open-guard-standing", name: "Top open guard (standing)", side: "top", counterpart: "bottom-open-guard-standing",
      summary: "You are standing in front of a seated or supine guard player. Control the legs and use speed and angles to pass." },
    { id: "bottom-open-guard-standing", name: "Bottom open guard (standing)", side: "bottom", counterpart: "top-open-guard-standing",
      summary: "You are on your back with an open guard against a standing passer. Manage distance with feet and grips." },
    { id: "top-open-guard-kneeling", name: "Top open guard (kneeling)", side: "top", counterpart: "bottom-open-guard-kneeling",
      summary: "You are on your knees inside an open guard. Pressure-passing territory: unders, over-unders, knee cuts and smashes." },
    { id: "bottom-open-guard-kneeling", name: "Bottom open guard (kneeling)", side: "bottom", counterpart: "top-open-guard-kneeling",
      summary: "You are on your back with an open guard against a kneeling passer. Good range for sweeps off broken posture." },
    { id: "top-open-guard-seated", name: "Top open guard (seated)", side: "top", counterpart: "bottom-open-guard-seated",
      summary: "Opponent is sitting up facing you. Control their head and knees so they can't wrestle up or drag you, then pass.",
      steps: [
        "Keep your hips back out of reach of their ankle grips.",
        "Push their head or shoulder back to the mat.",
        "Sprawl if they shoot under you.",
        "Grip the knees and pass."
      ] },
    { id: "bottom-open-guard-seated", name: "Bottom open guard (seated)", side: "bottom", counterpart: "top-open-guard-seated",
      summary: "Sitting up facing the opponent with your feet and hands active. Good for wrestling up, collar drags and leg entries.",
      steps: [
        "Sit up with one hand posted behind you.",
        "Keep your feet in front as frames.",
        "Grip a collar, sleeve or ankle.",
        "Wrestle up, drag, or enter the legs when they reach."
      ] },
    { id: "top-closed-guard-kneeling", name: "Top closed guard (kneeling)", side: "top", counterpart: "bottom-closed-guard-kneeling",
      summary: "You are inside the opponent's closed guard on your knees. Posture up and open the guard before you try to pass." },
    { id: "bottom-closed-guard-kneeling", name: "Bottom closed guard (kneeling)", side: "bottom", counterpart: "top-closed-guard-kneeling",
      summary: "Your legs are locked around the opponent's waist. Break their posture, then attack sweeps and submissions." },
    { id: "top-closed-guard-standing", name: "Top closed guard (standing)", side: "top", counterpart: "bottom-closed-guard-standing",
      summary: "You have stood up inside the opponent's closed guard, but their ankles are still locked. Keep posture and pressure the legs open before you pass.",
      steps: [
        "Stand with feet wide and hips forward.",
        "Keep a straight back and grips on their belt or chest.",
        "Push one knee down or step back to break the ankles.",
        "Control the legs as soon as the guard opens."
      ] },
    { id: "bottom-closed-guard-standing", name: "Bottom closed guard (standing)", side: "bottom", counterpart: "top-closed-guard-standing",
      summary: "Opponent has stood up inside your closed guard. Break their posture or switch to an open guard sweep before they open your legs.",
      steps: [
        "Keep your ankles locked while you have grips.",
        "Pull a sleeve or collar to break their posture.",
        "Sweep from the ankles or hips while they stand.",
        "If the guard opens, switch to an open guard."
      ] },
    { id: "top-half-guard", name: "Top half guard", side: "top", counterpart: "bottom-half-guard",
      summary: "You are on top with one leg trapped between the opponent's legs. Win the underhook and crossface, flatten them, and free the leg to pass." },
    { id: "bottom-half-guard", name: "Bottom half guard", side: "bottom", counterpart: "top-half-guard",
      summary: "One of the opponent's legs is trapped between yours. Stay on your side, win the underhook or a knee shield, and avoid getting flattened." },
    { id: "top-half-guard-knee-shield", name: "Top half guard (knee shield / Z guard)", side: "top", counterpart: "bottom-half-guard-knee-shield",
      summary: "Opponent has a knee across your chest as a shield. Flatten the knee and get your chest to theirs to pass.",
      steps: [
        "Grab their collar or head to stop them sitting up.",
        "Drive the shield knee down to the mat.",
        "Win the crossface and underhook.",
        "Free your leg and pass to side control."
      ] },
    { id: "bottom-half-guard-knee-shield", name: "Bottom half guard (knee shield / Z guard)", side: "bottom", counterpart: "top-half-guard-knee-shield",
      summary: "Half guard with your top knee across the opponent's chest as a frame. Keeps distance and blocks the crossface.",
      steps: [
        "Stay on your side, not flat.",
        "Put your top knee across their chest or hip.",
        "Frame on their collar or shoulder with your top hand.",
        "Fight for the underhook or switch to an open guard."
      ] },
    { id: "top-half-guard-deep", name: "Top half guard (deep half)", side: "top", counterpart: "bottom-half-guard-deep",
      summary: "Opponent is under your hips, hugging your trapped leg. Your base is in danger, so stay wide and heavy and free the leg.",
      steps: [
        "Widen the free leg for base.",
        "Keep your weight back over your hips, not forward.",
        "Use a whizzer on their far arm.",
        "Back-step or push their head away to free the leg."
      ] },
    { id: "bottom-half-guard-deep", name: "Bottom half guard (deep half)", side: "bottom", counterpart: "top-half-guard-deep",
      summary: "You are underneath the opponent, your body under their hips and both legs around one of their legs. Strong for sweeps like the waiter.",
      steps: [
        "Get your head and shoulders under their hips.",
        "Hug their trapped leg with both arms.",
        "Keep your legs locked around that leg.",
        "Off-balance them forward or sideways for the sweep."
      ] },
    { id: "top-cccbg", name: "Top cross collar, cuff & bicep guard", side: "top", counterpart: "bottom-cccbg",
      summary: "Opponent holds your cross collar and a cuff or bicep grip. Break or neutralise the collar grip before passing." },
    { id: "bottom-cccbg", name: "Bottom cross collar, cuff & bicep guard", side: "bottom", counterpart: "top-cccbg",
      summary: "You hold a cross collar and a cuff or bicep grip. Use the collar to off-balance and connect to sweeps and back takes." },
    { id: "top-dlr", name: "Top De La Riva guard", side: "top", counterpart: "bottom-dlr",
      summary: "Opponent has a De La Riva hook around your lead leg. Kill the hook and the far grip before attacking the pass." },
    { id: "bottom-dlr", name: "Bottom De La Riva guard", side: "bottom", counterpart: "top-dlr",
      summary: "Outside hook on the opponent's lead leg with heel or sleeve grips. Gateway to berimbolo, back takes and sweeps." },
    { id: "top-reverse-dlr", name: "Top reverse De La Riva guard", side: "top", counterpart: "bottom-reverse-dlr",
      summary: "Opponent's hook is on the inside of your lead leg. Watch for berimbolos and kiss-of-the-dragon back takes." },
    { id: "bottom-reverse-dlr", name: "Bottom reverse De La Riva guard", side: "bottom", counterpart: "top-reverse-dlr",
      summary: "Hook on the inside of the opponent's lead leg. Good for retention, berimbolo and kiss of the dragon." },
    { id: "top-lasso", name: "Top lasso guard", side: "top", counterpart: "bottom-lasso",
      summary: "Opponent's leg is wrapped around your arm. Free the arm or get to the outside before you pass." },
    { id: "bottom-lasso", name: "Bottom lasso guard", side: "bottom", counterpart: "top-lasso",
      summary: "Your leg wraps around the opponent's arm with a sleeve grip. A strong control guard for sweeps and stalling the pass." },
    { id: "top-lapel-guard", name: "Top lapel guard (worm)", side: "top", counterpart: "bottom-lapel-guard",
      summary: "Opponent has wrapped your own lapel around your leg. Break the lapel grip before you try to pass.",
      steps: [
        "Keep your lapel tucked into your belt to deny it.",
        "Pull your lead leg back and kill the wrap.",
        "Strip the lapel grip at the wrist.",
        "Pass once the leg is free."
      ] },
    { id: "bottom-lapel-guard", name: "Bottom lapel guard (worm)", side: "bottom", counterpart: "top-lapel-guard",
      summary: "Gi guards that use the opponent's own lapel, often wrapped around their lead leg (worm guard). Strong control of distance and the lead leg.",
      steps: [
        "Pull out the opponent's lapel.",
        "Feed it around their lead leg and grip it.",
        "Use the lapel grip to anchor and steer the leg.",
        "Sweep or take the back when they lose balance."
      ] },
    { id: "top-kguard", name: "Top K guard", side: "top", counterpart: "bottom-kguard",
      summary: "Opponent is underneath at an angle, threatening to enter the legs from K guard. Keep your knees safe and your hips back." },
    { id: "bottom-kguard", name: "Bottom K guard", side: "bottom", counterpart: "top-kguard",
      summary: "Inverted-angle guard for entering leg entanglements and back takes from under the opponent." },
    { id: "top-x-guard", name: "Top X guard", side: "top", counterpart: "bottom-x-guard",
      summary: "Opponent is underneath you with an X hook on your leg. Your base is compromised, so keep weight centred and look to step out." },
    { id: "bottom-x-guard", name: "Bottom X guard", side: "bottom", counterpart: "top-x-guard",
      summary: "Under the opponent with an X hook on one leg. Powerful elevation for sweeps." },
    { id: "top-rubber-guard", name: "Top rubber guard", side: "top", counterpart: "bottom-rubber-guard",
      summary: "Opponent is controlling your posture with a high leg. Keep posture and pin the leg down before it locks in." },
    { id: "bottom-rubber-guard", name: "Bottom rubber guard", side: "bottom", counterpart: "top-rubber-guard",
      summary: "High closed guard with a leg over the shoulder, held by the arm. Controls posture for omoplatas, triangles and gogoplatas." },
    { id: "top-butterfly", name: "Top butterfly guard", side: "top", counterpart: "bottom-butterfly",
      summary: "Opponent is seated with butterfly hooks. Flatten them or keep your hips heavy to stop the elevation." },
    { id: "bottom-butterfly", name: "Bottom butterfly guard", side: "bottom", counterpart: "top-butterfly",
      summary: "Seated with both feet hooked inside the opponent's thighs. Excellent for elevation sweeps and arm drags." },
    { id: "top-spider", name: "Top spider guard", side: "top", counterpart: "bottom-spider",
      summary: "Opponent controls your sleeves with feet on your biceps. Break the sleeve grips or circle to strip a foot." },
    { id: "bottom-spider", name: "Bottom spider guard", side: "bottom", counterpart: "top-spider",
      summary: "Sleeve grips with feet on the biceps. Controls distance and sets up triangles, omoplatas and sweeps." },

    // ---- neutral / legs ----
    { id: "top-slx", name: "Top single leg X (ashi garami)", side: "top", counterpart: "bottom-slx",
      summary: "Your leg is entangled in single leg X. Protect the heel, stay upright and step out to pass, or go to 50/50." },
    { id: "bottom-slx", name: "Bottom single leg X (ashi garami)", side: "bottom", counterpart: "top-slx",
      summary: "You entangle one leg with the opponent standing or kneeling. Sweeps and straight foot lock attacks." },
    { id: "fifty-fifty", name: "50/50", side: "neutral",
      summary: "Symmetrical leg entanglement where both athletes have the same attacks. Heel exposure and sweeps on both sides." },
    { id: "top-saddle", name: "Top saddle (inside sankaku)", side: "top", counterpart: "bottom-saddle",
      summary: "Your leg is trapped in the opponent's saddle. Protect your heel and knee before anything else.",
      steps: [
        "Hide your heel by pointing your toes.",
        "Hand-fight their grips on your foot.",
        "Work your knee out past their hips.",
        "Free the leg or counter-attack the legs."
      ] },
    { id: "bottom-saddle", name: "Bottom saddle (inside sankaku)", side: "bottom", counterpart: "top-saddle",
      summary: "You have your legs triangled around the opponent's thigh from the inside. The main heel hook control position.",
      steps: [
        "Bring your legs inside and around their leg.",
        "Triangle your legs across their hip.",
        "Squeeze your knees to control the knee line.",
        "Clamp the heel and attack."
      ] },

    // ---- negative / standing ----
    { id: "bottom-back-take-standing", name: "Bottom back take (standing)", side: "bottom", counterpart: "top-back-take-standing",
      summary: "Your opponent is behind you while standing. Priorities: protect the neck, break the grip lock, and turn to face them." },
    { id: "bottom-body-lock", name: "Bottom body lock (standing)", side: "bottom", counterpart: "top-body-lock",
      summary: "Opponent has their hands locked around your waist while standing. Break the grip and get your hips away before they trip or lift you.",
      steps: [
        "Get your hips back and widen your base.",
        "Frame on their head or neck to create space.",
        "Peel the grip apart at the wrists.",
        "Win an underhook or whizzer and turn to face them."
      ] },
    { id: "bottom-front-headlock", name: "Bottom front headlock", side: "bottom", counterpart: "top-front-headlock",
      summary: "Your head is trapped in front of the opponent, often after a failed shot. Protect the neck first, then square up and lift your head.",
      steps: [
        "Hand-fight the arm around your neck before anything else.",
        "Square your hips up underneath you.",
        "Drive your head up into their chest.",
        "Circle out or stand up once the head is free."
      ] },

    // ---- negative / post guard ----
    { id: "bottom-side-control", name: "Bottom side control", side: "bottom", counterpart: "top-side-control",
      summary: "Opponent is across your chest. Frame on the hip and neck, make space, and recover guard or come up to your knees." },
    { id: "bottom-side-control-kesa", name: "Bottom side control (kesa gatame)", side: "bottom", counterpart: "top-side-control-kesa",
      summary: "Opponent is sitting beside you in a scarf hold with your head and near arm wrapped. Free the arm, then bridge them over or take their back.",
      steps: [
        "Pull your trapped elbow down toward your hip.",
        "Frame your far arm on their head or hip.",
        "Bridge high into them and turn.",
        "Roll them over your chest, or slide behind them to take the back."
      ] },
    { id: "bottom-knee-on-belly", name: "Bottom knee on belly", side: "bottom", counterpart: "top-knee-on-belly",
      summary: "Opponent's knee is driving into your stomach. Frame on the knee, turn in and recover guard before they mount.",
      steps: [
        "Push the knee down toward your hips with both hands.",
        "Shrimp away from the knee to make space.",
        "Turn in and bring your own knee back inside.",
        "Recover guard or come up on a single leg."
      ] },
    { id: "bottom-mount", name: "Bottom mount", side: "bottom", counterpart: "top-mount",
      summary: "Opponent is mounted on you. Keep elbows tight, protect the neck, and escape with bridges and elbow-knee movement." },
    { id: "bottom-mount-s", name: "Bottom mount (S-mount)", side: "bottom", counterpart: "top-mount-s",
      summary: "Opponent is in S-mount with an arm isolated. The arm bar is coming, so protect the elbow and escape before they swing the leg over.",
      steps: [
        "Clasp your hands and keep the elbows tight.",
        "Bridge toward the knee by your head.",
        "Turn into them and push that knee down.",
        "Escape the hips and recover half guard."
      ] },
    { id: "bottom-mount-technical", name: "Bottom mount (technical)", side: "bottom", counterpart: "top-mount-technical",
      summary: "You turned to your side under mount and their knee is now behind your back. Turning further gives up your back, so turn back in and escape.",
      steps: [
        "Stop turning away: that gives them your back.",
        "Turn back flat toward their posted leg.",
        "Frame on the posted knee.",
        "Elbow-knee escape to recover half guard."
      ] },
    { id: "bottom-back-mount", name: "Bottom back mount", side: "bottom", counterpart: "top-back-mount",
      summary: "Opponent has your back. Defend the neck first, clear a hook, and slide your back to the mat on the side of the bottom hook." },
    { id: "bottom-crucifix", name: "Bottom crucifix", side: "bottom", counterpart: "top-crucifix",
      summary: "Both arms are trapped and your neck is open. Keep your chin tucked and free the arm trapped by their legs before they settle.",
      steps: [
        "Tuck your chin and keep your free hand near your neck.",
        "Turn toward them, putting the leg-trapped shoulder to the mat.",
        "Walk your hips away to pull the arm out.",
        "Recover turtle or guard."
      ] },
    { id: "bottom-turtle", name: "Bottom turtle", side: "bottom", counterpart: "top-turtle",
      summary: "You are on hands and knees, often after avoiding a pass. Keep elbows to knees, protect the neck, and recover guard or go for a single leg." },
    { id: "bottom-north-south", name: "Bottom north south", side: "bottom", counterpart: "top-north-south",
      summary: "Opponent is pinning you head-to-hips. Protect the neck, frame on the hips, and turn in to recover guard." }
  ],

  techniques: [
    // ---- from Top back take (standing) ----
    { id: "pull-down", name: "Pull down", from: "top-back-take-standing", to: "top-back-mount", col: "transition", type: "takedown", status: "draft",
      summary: "Bringing a standing opponent to the mat from behind while keeping back control." },

    // ---- from Top body lock (standing) ----
    { id: "body-lock-takedown", name: "Body lock takedown", from: "top-body-lock", to: "top-half-guard", col: "transition", type: "takedown", status: "draft",
      summary: "From the body lock, pull the opponent's hips in and trip or sit them down.",
      steps: [
        "Lock hands tight around their waist.",
        "Pull their hips into you and step to the side.",
        "Block a leg with your foot (outside trip).",
        "Drive them down and land in top half guard."
      ] },

    // ---- from Top front headlock ----
    { id: "darce-choke", name: "Darce choke", from: "top-front-headlock", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Arm-in choke threaded under the near arm and around the neck, locked with a gable or biceps grip.",
      steps: [
        "Thread your arm under their near arm and across the neck.",
        "Lock onto your other biceps.",
        "Walk toward their head and flatten them out.",
        "Squeeze, sprawling your hips to the mat."
      ],
      notes: "Also common from top half guard when they come up on an underhook." },
    { id: "anaconda-choke", name: "Anaconda choke", from: "top-front-headlock", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Arm-in choke from the front headlock, finished by rolling under the opponent.",
      steps: [
        "Shoot your arm under their neck and through their far armpit.",
        "Lock the arm-in grip on your biceps.",
        "Roll toward the trapped arm, under them.",
        "Walk your feet toward their hips and squeeze."
      ] },

    // ---- from Top side control ----
    { id: "kimura", name: "Kimura", from: "top-side-control", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Figure-four shoulder lock that rotates the arm behind the opponent's back.",
      steps: [
        "Grip the opponent's wrist with your near-side hand.",
        "Thread your other arm under their triceps and grab your own wrist.",
        "Keep their elbow tight to your chest and bend the arm to 90°.",
        "Rotate the hand toward their head and behind their back for the finish."
      ] },
    { id: "americana", name: "Americana", from: "top-side-control", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Figure-four shoulder lock with the opponent's arm bent palm-up beside their head.",
      steps: [
        "Pin the far wrist to the mat with the elbow bent at 90°.",
        "Thread your other arm under their elbow and grab your own wrist.",
        "Keep the wrist on the mat and slide it toward their hip.",
        "Lift the elbow to finish."
      ] },
    { id: "paper-cutter-choke", name: "Paper cutter choke", from: "top-side-control", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Gi choke from side control, using a deep collar grip and a forearm that cuts across the neck.",
      steps: [
        "Feed your near hand deep into the far collar.",
        "Drop your other forearm across their throat.",
        "Drive your elbow toward the mat like closing a paper cutter."
      ] },

    // ---- from Top knee on belly ----
    { id: "baseball-bat-choke", name: "Baseball bat choke", from: "top-knee-on-belly", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Gi choke using two same-direction collar grips like holding a bat, finished by rotating around the opponent's head.",
      steps: [
        "Get one hand deep in the collar, thumb inside.",
        "Put the other hand close by with the thumb out.",
        "Bring your head down and spin toward their head.",
        "Rotate until the choke closes."
      ] },

    // ---- from Top mount ----
    { id: "cross-collar-choke", name: "Cross collar choke", from: "top-mount", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Gi choke using both collar grips, crossing the wrists to close the sides of the neck.",
      steps: [
        "Feed the first hand deep into the collar, fingers in.",
        "Place the second grip on the opposite collar.",
        "Drop your elbows toward the mat and pull them apart as you bring your head down."
      ] },
    { id: "head-and-arm-choke", name: "Head and arm choke", from: "top-mount", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Arm triangle: their own shoulder and your arm close off the neck.",
      steps: [
        "Push their arm across their face and drop your head on it.",
        "Wrap your arm behind their neck and lock your hands.",
        "Dismount to the side of your choking arm.",
        "Squeeze, driving your shoulder into theirs."
      ] },
    { id: "arm-bar-mount", name: "Arm bar (from mount)", from: "top-mount", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Arm bar that comes from high mount or S-mount when the opponent pushes up on your chest.",
      steps: [
        "Climb to high mount and isolate one arm.",
        "Step to [[Top mount (S-mount)]] on the side of the arm.",
        "Swing your leg over their head and sit close to the shoulder.",
        "Pinch the knees, thumb up, and lift the hips."
      ] },
    { id: "ezekiel-choke", name: "Ezekiel choke", from: "top-mount", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Sleeve choke: one hand inside your own sleeve, the other hand's edge across the throat.",
      steps: [
        "Feed one arm behind their head and grab inside your opposite sleeve.",
        "Bring the free hand across their throat.",
        "Drive the blade of the hand down as you pull with the sleeve grip."
      ],
      notes: "Works from [[Top mount]] and even from inside someone's guard. In no-gi, grip your own wrist or forearm instead of the sleeve." },

    // ---- from Top back mount ----
    { id: "bow-and-arrow", name: "Bow and arrow", from: "top-back-mount", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Collar choke from the back, with the opponent stretched out like a drawn bow.",
      steps: [
        "Get a deep collar grip with your choking hand.",
        "Grab their pants at the knee with the other hand.",
        "Swing your leg over their shoulder and turn to the side.",
        "Stretch back with the collar and pull the leg toward you."
      ] },
    { id: "lapel-choke", name: "Lapel choke", from: "top-back-mount", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Choke from the back using the opponent's own lapel as the strangling grip." },
    { id: "arm-bar-back", name: "Arm bar (from back)", from: "top-back-mount", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Arm bar when the opponent defends the choke by bringing their arms high." },
    { id: "rear-naked-choke", name: "Rear naked choke", from: "top-back-mount", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Blood choke from the back: your arm wraps the neck and is locked behind their head with the other arm.",
      steps: [
        "From the seatbelt, slide the choking arm under their chin so the elbow lines up with the chin.",
        "Grab your own biceps with the choking hand.",
        "Put the other hand behind their head.",
        "Squeeze your elbows together and expand your chest."
      ],
      notes: "Hand fighting is the battle. Win the [[Grip fighting]] first, and keep your hooks or body triangle so they can't turn in. Defense: [[Back escape]]." },

    // ---- from Top turtle ----
    { id: "clock-choke", name: "Clock choke", from: "top-turtle", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Collar choke against the turtle, finished by walking your legs around the opponent's head like a clock hand.",
      steps: [
        "Feed a deep collar grip under their neck.",
        "Block their arm with your other hand.",
        "Sprawl your weight onto their back.",
        "Walk your legs around toward their head to tighten."
      ] },
    { id: "seatbelt-back-take", name: "Seatbelt back take", from: "top-turtle", to: "top-back-mount", col: "transition", type: "back take", status: "draft",
      summary: "Establish the seatbelt grip on the turtle and roll or insert hooks to take the back.",
      steps: [
        "Seatbelt: one arm over the shoulder, one under the armpit, hands locked.",
        "Chest glued to their back.",
        "Insert the near hook.",
        "Roll to the side of the under-arm and insert the second hook."
      ] },

    // ---- from Top north south ----
    { id: "north-south-choke", name: "North south choke", from: "top-north-south", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Choke from north south using the side of your chest and arm against the neck.",
      steps: [
        "Thread an arm under their neck and grip near their armpit.",
        "Line up the side of your chest with their neck.",
        "Drop your hips and sprawl to close the choke."
      ] },

    // ---- from Standing ----
    { id: "guillotine", name: "Guillotine", from: "standing", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Front choke with your forearm under the opponent's chin while their head is under your armpit.",
      steps: [
        "Catch the head as they shoot or bend forward.",
        "Wrap the arm under their chin, blade of the wrist into the throat.",
        "Grip your wrist or use an arm-in grip.",
        "Pull your elbow to your ribs, then close guard or sprawl and lift."
      ],
      notes: "Also from closed guard and [[Top front headlock]]. Defense: [[Guillotine defense]]." },
    { id: "double-leg", name: "Double leg", from: "standing", to: "top-side-control", col: "transition", type: "takedown", status: "draft",
      summary: "Takedown that attacks both legs, driving through the opponent.",
      steps: [
        "Set up with a level change.",
        "Penetration step deep between their feet.",
        "Wrap behind both knees with your head on their side.",
        "Drive forward and turn the corner to land on top."
      ] },
    { id: "single-leg", name: "Single leg", from: "standing", to: "top-half-guard", col: "transition", type: "takedown", status: "draft",
      summary: "Takedown that controls one leg, then finishes by running the pipe, tripping or lifting." },
    { id: "knee-tap", name: "Knee tap", from: "standing", to: "top-half-guard", col: "transition", type: "takedown", status: "draft",
      summary: "Block the opponent's knee while pushing their upper body over the blocked leg.",
      steps: [
        "Get a collar tie or head control.",
        "Pull them forward so they step.",
        "Block the outside of the stepping knee with your hand.",
        "Drive diagonally over the blocked knee."
      ] },
    { id: "guard-pull", name: "Guard pull", from: "standing", to: "bottom-closed-guard-kneeling", col: "transition", type: "transition", status: "draft",
      summary: "Taking the fight to the ground by sitting or jumping into your guard." },
    { id: "osoto-gari", name: "Osoto gari", from: "standing", to: "top-side-control", col: "transition", type: "takedown", status: "draft",
      summary: "Major outer reap: break balance to the rear corner and reap the supporting leg from the outside.",
      steps: [
        "Grip sleeve and collar.",
        "Step beside their leg, chest to chest.",
        "Drive their weight onto the near heel.",
        "Reap the leg back while pushing the upper body down."
      ] },
    { id: "ouchi-gari", name: "Ouchi gari", from: "standing", to: "top-closed-guard-kneeling", col: "transition", type: "takedown", status: "draft",
      summary: "Major inner reap: hook the inside of the opponent's leg and drive them backward.",
      steps: [
        "Grip and push them back so they step.",
        "Hook the inside of their leg with your leg.",
        "Sweep the leg out in a circle.",
        "Drive forward to land on top."
      ] },
    { id: "ankle-pick", name: "Ankle pick", from: "standing", to: "top-open-guard-standing", col: "transition", type: "takedown", status: "draft",
      summary: "Pull the opponent forward onto one leg, then pick that ankle while pushing the head back.",
      steps: [
        "Collar tie and pull them forward so they step.",
        "Level change and grab the heel of the lead foot.",
        "Drive the head back and down.",
        "Pull the heel and land in a passing position."
      ] },
    { id: "arm-drag", name: "Arm drag", from: "standing", to: "top-back-take-standing", col: "transition", type: "back take", status: "draft",
      summary: "Pull the opponent's arm across your body to take the angle and get behind them.",
      steps: [
        "Grab their wrist with your same-side hand.",
        "Reach the other hand to the back of their triceps.",
        "Pull the arm across while stepping to the outside.",
        "Circle behind to the [[Top back take (standing)]]."
      ] },
    { id: "snap-down", name: "Snap down", from: "standing", to: "top-front-headlock", col: "transition", type: "takedown", status: "draft",
      summary: "Pull the opponent's head down sharply to their knees and land in the front headlock.",
      steps: [
        "Collar tie and triceps control.",
        "Push into them so they push back.",
        "Snap the head down with your body weight.",
        "Sprawl into the [[Top front headlock]]."
      ] },
    { id: "sumi-gaeshi", name: "Sumi gaeshi", from: "standing", to: "top-side-control", col: "transition", type: "takedown", status: "draft",
      summary: "Sacrifice throw: drop under the opponent, hook their inner thigh with your foot, and roll them over.",
      steps: [
        "Grip the belt or back over the top, and a sleeve.",
        "Drop your hips under them as they bend forward.",
        "Lift their inner thigh with your instep.",
        "Roll them over and follow to the top."
      ] },
    { id: "sprawl", name: "Sprawl", from: "standing", to: null, col: "defense", type: "defense", status: "draft", counters: ["double-leg","single-leg"],
      summary: "Throw your legs back and drop your hips onto the opponent to stop a leg attack.",
      steps: [
        "Underhooks or crossface as they shoot.",
        "Kick your legs back and wide.",
        "Drop your hips onto their shoulders.",
        "Circle to their back or the [[Top front headlock]]."
      ],
      notes: "Once the shot is stopped, follow up with a [[Snap down]] to the [[Top front headlock]]." },
    { id: "guillotine-defense", name: "Guillotine defense", from: "standing", to: null, col: "defense", type: "defense", status: "draft", counters: ["guillotine"],
      summary: "Clear the choking hand from your throat and move to the side where your head is.",
      steps: [
        "Two-on-one the choking wrist and pull it down.",
        "Turn your chin toward their ribs.",
        "Step or pass to the side your head is on.",
        "Shoulder pressure into their jaw to relieve the choke."
      ] },

    // ---- from Top open guard (standing) ----
    { id: "toreando-pass", name: "Toreando pass", from: "top-open-guard-standing", to: "top-side-control", col: "transition", type: "pass", status: "complete",
      summary: "Standing speed pass: control both knees, redirect the legs to one side and circle to side control.",
      steps: [
        "Grip both pant legs at the knees.",
        "Push the legs to one side and down to the mat.",
        "Step around on the opposite side.",
        "Drop your chest to side control before they recover."
      ] },

    // ---- from Bottom open guard (standing) ----
    { id: "tripod-sweep", name: "Tripod sweep", from: "bottom-open-guard-standing", to: "top-open-guard-standing", col: "transition", type: "sweep", status: "draft",
      summary: "Hook behind one ankle, push the other hip, and topple the standing opponent backward.",
      steps: [
        "Grip one ankle and hook behind it with your foot.",
        "Push the opposite hip with your other foot.",
        "Pull the ankle as you push.",
        "Come up as they fall."
      ] },
    { id: "sickle-sweep", name: "Sickle sweep", from: "bottom-open-guard-standing", to: "top-open-guard-standing", col: "transition", type: "sweep", status: "draft",
      summary: "Follow-up to the tripod: hold the ankle and chop behind the far heel.",
      steps: [
        "Grip the near ankle.",
        "Hook your foot behind their far heel.",
        "Chop the heel while pulling the ankle.",
        "Come up on top."
      ] },
    { id: "technical-stand-up", name: "Technical stand-up", from: "bottom-open-guard-standing", to: "standing", col: "transition", type: "transition", status: "draft",
      summary: "Get up from the mat safely, keeping a frame and base the whole time.",
      steps: [
        "Post one hand behind you and plant the opposite foot.",
        "Frame forward with your free hand or foot.",
        "Lift your hips and swing the posted leg back through.",
        "Stand in a stance, facing them."
      ] },
    { id: "guard-retention", name: "Guard retention (standing)", from: "bottom-open-guard-standing", to: null, col: "defense", type: "defense", status: "draft", counters: ["toreando-pass"],
      summary: "Using frames, hip movement and leg pummeling to stop the opponent from passing your guard.",
      steps: [
        "Keep your knees and elbows connected (no gaps).",
        "Face the opponent: turn your hips toward them as they move.",
        "Frame on hips, shoulders or biceps with hands and feet.",
        "Pummel your legs back inside when they clear one."
      ],
      notes: "See [[Frames]], [[Pressure]] and [[Technical stand-up]]." },

    // ---- from Top open guard (kneeling) ----
    { id: "double-under-pass", name: "Double under pass", from: "top-open-guard-kneeling", to: "top-side-control", col: "transition", type: "pass", status: "complete",
      summary: "Both arms under the legs to stack the opponent, then pass around one side.",
      steps: [
        "Scoop both arms under their thighs.",
        "Lock your hands or grip the belt/collar.",
        "Stack their hips up over their shoulders.",
        "Walk around one side and drop into side control."
      ] },
    { id: "over-under-pass", name: "Over under pass", from: "top-open-guard-kneeling", to: "top-side-control", col: "transition", type: "pass", status: "complete",
      summary: "One arm over a leg, one arm under the other, with heavy shoulder pressure.",
      steps: [
        "Underhook one leg, go over the top of the other.",
        "Connect the over arm to their far hip.",
        "Pressure with your head and shoulder.",
        "Walk your hips around to the side of the over arm."
      ] },
    { id: "knee-cut-pass", name: "Knee cut pass", from: "top-open-guard-kneeling", to: "top-side-control", col: "transition", type: "pass", status: "complete",
      summary: "Slide your knee across the opponent's thigh while controlling the upper body.",
      steps: [
        "Control the near leg's pant or knee.",
        "Cut your knee across their thigh toward the mat.",
        "Get an underhook or crossface.",
        "Free the trailing foot and settle into side control."
      ] },
    { id: "leg-drag", name: "Leg drag", from: "top-open-guard-kneeling", to: "top-side-control", col: "transition", type: "pass", status: "draft",
      summary: "Drag the opponent's legs across your body and pin their hips sideways." },
    { id: "long-step-pass", name: "Long step pass", from: "top-open-guard-kneeling", to: "top-side-control", col: "transition", type: "pass", status: "draft",
      summary: "From a pressure position, take a long step back and around to clear the legs." },
    { id: "smash-pass", name: "Smash pass", from: "top-open-guard-kneeling", to: "top-side-control", col: "transition", type: "pass", status: "draft",
      summary: "Fold both legs to one side and smash them with hip pressure, then pass around." },

    // ---- from Bottom open guard (kneeling) ----
    { id: "guard-retention-kneeling", name: "Guard retention (kneeling)", from: "bottom-open-guard-kneeling", to: null, col: "defense", type: "defense", status: "draft", counters: ["double-under-pass","over-under-pass","knee-cut-pass","leg-drag","long-step-pass","smash-pass"],
      summary: "Stopping pressure passes by keeping your knees between you and the opponent and refusing to be flattened.",
      steps: [
        "Stay on your side, never flat.",
        "Frame on the head and shoulders.",
        "Keep your knees connected to your elbows.",
        "Pummel your legs back inside when they clear one."
      ] },

    // ---- from Top open guard (seated) ----
    { id: "loop-choke-defense", name: "Loop choke defense", from: "top-open-guard-seated", to: null, col: "defense", type: "defense", status: "draft", counters: ["loop-choke"],
      summary: "Keep your head up and don't dive in while they hold a deep collar grip.",
      steps: [
        "Keep your head up and posture strong.",
        "Strip the collar grip.",
        "Move your head out of the loop.",
        "Pass toward the side of the grip."
      ] },

    // ---- from Bottom open guard (seated) ----
    { id: "loop-choke", name: "Loop choke", from: "bottom-open-guard-seated", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Gi choke from a collar grip that loops around the opponent's neck when they shoot in or drop their head.",
      steps: [
        "Get a deep collar grip, palm down, while their head is low.",
        "Push their head under your arm.",
        "Loop the arm over the back of the neck.",
        "Roll to the side and drive their head down."
      ] },

    // ---- from Top closed guard (kneeling) ----
    { id: "closed-guard-opening-standing", name: "Closed guard opening (standing)", from: "top-closed-guard-kneeling", to: "top-open-guard-standing", col: "transition", type: "transition", status: "complete",
      summary: "Posture up and stand to break the opponent's closed guard.",
      steps: [
        "Establish posture with grips on their chest or belt.",
        "Step one foot up, then the other.",
        "Keep your back straight and hips forward.",
        "Step back or drop a knee to break the locked ankles."
      ] },
    { id: "triangle-defense", name: "Triangle defense", from: "top-closed-guard-kneeling", to: null, col: "defense", type: "defense", status: "draft", counters: ["triangle-choke"],
      summary: "Keep posture, keep both arms on the same side, and stack the opponent before the figure-four locks.",
      steps: [
        "Never leave one arm in and one arm out.",
        "Posture up straight and drive your trapped arm across.",
        "Stack them by stepping up and driving forward.",
        "Pass toward the side of the trapped arm."
      ] },
    { id: "arm-bar-defense-guard", name: "Arm bar defense (closed guard)", from: "top-closed-guard-kneeling", to: null, col: "defense", type: "defense", status: "draft", counters: ["arm-bar-guard"],
      summary: "Hide the elbow, stack the opponent and pull the arm out before the hips lift.",
      steps: [
        "Keep your elbows inside your knees.",
        "Grip your own wrist or lapel.",
        "Stack them by standing and driving forward.",
        "Rotate the thumb down and pull out."
      ] },
    { id: "omoplata-defense", name: "Omoplata defense", from: "top-closed-guard-kneeling", to: null, col: "defense", type: "defense", status: "draft", counters: ["omoplata"],
      summary: "Roll forward before the lock is set, or grab the belt and posture up.",
      steps: [
        "Keep your posture and elbows tight.",
        "If the leg comes over, grab their belt or pants.",
        "Roll forward over your trapped shoulder.",
        "Come up facing them."
      ] },

    // ---- from Bottom closed guard (kneeling) ----
    { id: "triangle-choke", name: "Triangle choke", from: "bottom-closed-guard-kneeling", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Leg choke that traps the opponent's head and one arm inside a figure-four of your legs.",
      steps: [
        "Control one arm and push it to their belly while pulling the other arm.",
        "Shoot your leg over their shoulder and across the back of the neck.",
        "Angle off and lock the figure-four behind your knee.",
        "Pull the head down, squeeze the knees and lift the hips."
      ],
      notes: "Also available from [[Bottom spider guard]] and [[Bottom rubber guard]]. Defense: [[Triangle defense]]." },
    { id: "arm-bar-guard", name: "Arm bar (from guard)", from: "bottom-closed-guard-kneeling", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Hyperextends the elbow from closed guard after breaking the opponent's posture.",
      steps: [
        "Break their posture and control one arm across your chest.",
        "Put a foot on their hip and pivot your body perpendicular to theirs.",
        "Swing your leg over their face.",
        "Pinch your knees, thumb up, and lift your hips."
      ],
      notes: "Chains well with the [[Triangle choke]] and [[Omoplata]]. Defense: [[Arm bar defense (hitchhiker)]]." },
    { id: "omoplata", name: "Omoplata", from: "bottom-closed-guard-kneeling", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Shoulder lock using your legs to rotate the opponent's arm behind their back.",
      steps: [
        "Control their wrist and angle off to that side.",
        "Swing your leg over their shoulder from the outside.",
        "Sit up and turn so you face the same way they do.",
        "Control their hips and lean forward to finish."
      ],
      notes: "Often set up from [[Bottom rubber guard]] and [[Bottom spider guard]]. If they roll, you sweep." },
    { id: "scissor-sweep", name: "Scissor sweep", from: "bottom-closed-guard-kneeling", to: "top-mount", col: "transition", type: "sweep", status: "draft",
      summary: "Knee across the belly and a chop to the base leg, sweeping with collar and sleeve grips.",
      steps: [
        "Grip collar and same-side sleeve.",
        "Shrimp out and put your shin across their belly.",
        "Drop your bottom leg against their knee.",
        "Pull them forward, scissor your legs and roll to mount."
      ] },
    { id: "flower-sweep", name: "Flower sweep", from: "bottom-closed-guard-kneeling", to: "top-mount", col: "transition", type: "sweep", status: "draft",
      summary: "Pendulum sweep: control an arm, scoop a leg and swing your leg to roll the opponent over.",
      steps: [
        "Control their arm on one side.",
        "Hook under their opposite leg.",
        "Swing your free leg up and over like a pendulum.",
        "Use the momentum to roll them and come up on top."
      ] },
    { id: "kimura-hip-bump", name: "Kimura hip bump", from: "bottom-closed-guard-kneeling", to: "top-mount", col: "transition", type: "sweep", status: "draft",
      summary: "Sit up, post on a hand and bump the opponent over with your hips. Chains to the kimura if they post.",
      steps: [
        "Sit up onto your elbow, then your hand.",
        "Reach your other arm over their shoulder.",
        "Bump your hips up and into them to roll them over.",
        "If they post their hand, switch to the kimura."
      ] },

    // ---- from Top half guard ----
    { id: "knee-bar", name: "Knee bar", from: "top-half-guard", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Arm bar for the leg: hyperextends the knee by pulling the foot against your hips.",
      steps: [
        "Isolate one leg and slide your knee between their legs.",
        "Roll or fall to the side, hugging the leg.",
        "Get the kneecap past your hips.",
        "Pinch the knees, pull the foot to your chest and extend your hips."
      ] },

    // ---- from Bottom half guard ----
    { id: "nogueira-sweep", name: "Nogueira sweep", from: "bottom-half-guard", to: "top-side-control", col: "transition", type: "sweep", status: "draft",
      summary: "" },
    { id: "old-school-sweep", name: "Old school sweep", from: "bottom-half-guard", to: "top-half-guard", col: "transition", type: "sweep", status: "draft",
      summary: "Classic half guard sweep: underhook, come to your knees, grab the ankle and drive.",
      steps: [
        "Win the underhook and get on your side.",
        "Reach the other arm under and grab their ankle.",
        "Come up to your knees.",
        "Drive into them to tip them over."
      ] },
    { id: "knee-bar-defense", name: "Knee bar defense", from: "bottom-half-guard", to: null, col: "defense", type: "defense", status: "draft", counters: ["knee-bar"],
      summary: "Keep your knees together and stop the kneecap passing their hips.",
      steps: [
        "Keep your knees together.",
        "Turn toward them as they fall.",
        "Bend the leg to keep the knee line protected.",
        "Pull the leg out."
      ] },

    // ---- from Bottom half guard (deep half) ----
    { id: "waiter-sweep", name: "Waiter sweep", from: "bottom-half-guard-deep", to: "top-half-guard", col: "transition", type: "sweep", status: "draft",
      summary: "From deep half, lift the opponent's far leg like a waiter's tray and tip them over.",
      steps: [
        "Establish deep half guard.",
        "Put a hand under their far leg.",
        "Lift the leg as you push into the trapped leg.",
        "Come up on top."
      ] },

    // ---- from Top cross collar, cuff & bicep guard ----
    { id: "cccbg-pass", name: "CCCBG pass", from: "top-cccbg", to: "top-side-control", col: "transition", type: "pass", status: "draft",
      summary: "Passing against the cross collar, cuff and bicep guard." },

    // ---- from Top De La Riva guard ----
    { id: "dlr-pass", name: "DLR pass", from: "top-dlr", to: "top-side-control", col: "transition", type: "pass", status: "draft",
      summary: "Passing the De La Riva guard by killing the hook first." },

    // ---- from Bottom De La Riva guard ----
    { id: "berimbolo", name: "Berimbolo", from: "bottom-dlr", to: "top-back-mount", col: "transition", type: "back take", status: "draft",
      summary: "Invert under the opponent from De La Riva to off-balance them and roll to their back.",
      steps: [
        "DLR hook with a belt or pants grip on the far side.",
        "Off-balance them so they sit.",
        "Invert, using the DLR hook to steer their hips.",
        "Come up behind them and take the back."
      ] },

    // ---- from Top reverse De La Riva guard ----
    { id: "reverse-dlr-pass", name: "Reverse DLR pass", from: "top-reverse-dlr", to: "top-side-control", col: "transition", type: "pass", status: "draft",
      summary: "Passing the reverse De La Riva guard." },

    // ---- from Bottom reverse De La Riva guard ----
    { id: "kiss-of-the-dragon", name: "Kiss of the dragon", from: "bottom-reverse-dlr", to: "top-back-mount", col: "transition", type: "back take", status: "draft",
      summary: "Invert under the opponent's legs from reverse De La Riva to take the back.",
      steps: [
        "Reverse DLR hook with a grip on the far leg.",
        "Invert, bringing your head toward their far heel.",
        "Slide between their legs to come out behind them.",
        "Seatbelt and insert hooks."
      ] },

    // ---- from Top lasso guard ----
    { id: "lasso-pass", name: "Lasso pass", from: "top-lasso", to: "top-side-control", col: "transition", type: "pass", status: "draft",
      summary: "Freeing the arm from the lasso and passing." },

    // ---- from Bottom X guard ----
    { id: "x-guard-sweep", name: "X guard sweep", from: "bottom-x-guard", to: "top-open-guard-standing", col: "transition", type: "sweep", status: "draft",
      summary: "Extend your X hooks to off-balance the opponent, then stand up in base as they fall.",
      steps: [
        "Hug the near leg and extend the X hooks.",
        "Push their weight backward.",
        "Technical stand-up as they fall.",
        "Land in a passing position."
      ] },

    // ---- from Bottom butterfly guard ----
    { id: "butterfly-sweep", name: "Butterfly hook sweep", from: "bottom-butterfly", to: "top-mount", col: "transition", type: "sweep", status: "draft",
      summary: "Underhook and sleeve control, fall to one side and elevate with a butterfly hook.",
      steps: [
        "Underhook on one side, sleeve or overhook on the other.",
        "Pull them forward so their weight is on you.",
        "Fall to the overhook side.",
        "Elevate with the hook on the underhook side and follow them over."
      ] },

    // ---- from Top spider guard ----
    { id: "spider-pass", name: "Spider pass", from: "top-spider", to: "top-side-control", col: "transition", type: "pass", status: "draft",
      summary: "Breaking the sleeve grips of the spider guard and passing." },

    // ---- from Top single leg X (ashi garami) ----
    { id: "slx-pass", name: "SLX pass", from: "top-slx", to: "top-side-control", col: "transition", type: "pass", status: "draft",
      summary: "Freeing the trapped leg from single leg X and passing." },
    { id: "fifty-fifty-entry", name: "50/50 entry", from: "top-slx", to: "fifty-fifty", col: "transition", type: "transition", status: "draft",
      summary: "Entering 50/50 from the top of single leg X." },
    { id: "straight-ankle-lock-defense", name: "Straight ankle lock defense", from: "top-slx", to: null, col: "defense", type: "defense", status: "draft", counters: ["straight-ankle-lock"],
      summary: "Flex your foot and sit up, stepping over so the forearm comes off the Achilles.",
      steps: [
        "Flex your foot (toes to shin).",
        "Sit up and grab their collar or arm.",
        "Push the attacking arm down off your Achilles.",
        "Pull the foot out."
      ] },

    // ---- from Bottom single leg X (ashi garami) ----
    { id: "straight-ankle-lock", name: "Straight ankle lock", from: "bottom-slx", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Foot lock that hyperextends the ankle, with the foot trapped in your armpit.",
      steps: [
        "Trap the foot in your armpit, toes pointing out.",
        "Blade of the forearm under the Achilles.",
        "Grip your own arm or lapel.",
        "Keep the knee pinched, arch back and lift the forearm."
      ] },

    // ---- from 50/50 ----
    { id: "toe-hold", name: "Toe hold", from: "fifty-fifty", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Figure-four foot lock that twists the foot inward against the ankle.",
      steps: [
        "Grip the outside of the foot with your same-side hand.",
        "Thread the other arm behind the ankle and grab your wrist.",
        "Pull the foot toward their hip and rotate inward."
      ] },
    { id: "toe-hold-defense", name: "Toe hold defense", from: "fifty-fifty", to: null, col: "defense", type: "defense", status: "draft", counters: ["toe-hold"],
      summary: "Point the toes and turn with the twist, then grab their grip.",
      steps: [
        "Point your toes and keep the foot straight.",
        "Rotate with the twist, not against it.",
        "Grab their wrist to break the figure-four.",
        "Pull the foot out."
      ] },

    // ---- from Top saddle (inside sankaku) ----
    { id: "heel-hook-defense", name: "Heel hook defense", from: "top-saddle", to: null, col: "defense", type: "defense", status: "draft", counters: ["heel-hook"],
      summary: "Hide the heel, clear the knee line, and never spin against the lock.",
      steps: [
        "Point your toes and hide the heel from their grip.",
        "Pull your knee out past their hips (clear the knee line).",
        "Fight their grip with your hands.",
        "Turn only with the direction of the rotation, never against it."
      ] },

    // ---- from Bottom saddle (inside sankaku) ----
    { id: "heel-hook", name: "Heel hook", from: "bottom-saddle", to: null, col: "sub", type: "submission", status: "draft",
      summary: "Rotational leg lock that twists the heel to attack the knee. Very dangerous: apply slowly and tap early.",
      steps: [
        "Control the knee line from the [[Bottom saddle (inside sankaku)]].",
        "Trap the heel in the crook of your elbow.",
        "Lock your hands together.",
        "Rotate your shoulders and body slowly."
      ],
      notes: "Not allowed at many white-belt and gi rulesets. Defense: [[Heel hook defense]]." },

    // ---- from Bottom front headlock ----
    { id: "arm-in-choke-defense", name: "Arm-in choke defense (darce / anaconda)", from: "bottom-front-headlock", to: null, col: "defense", type: "defense", status: "draft", counters: ["darce-choke","anaconda-choke"],
      summary: "Get your trapped arm and head free before the grip locks, and never roll for them.",
      steps: [
        "Pull your trapped arm out and down.",
        "Turn your head away from the choking arm.",
        "Square your hips and drive into them.",
        "Don't roll: that tightens the anaconda."
      ] },

    // ---- from Bottom side control ----
    { id: "side-control-escape-shrimp", name: "Side control escape (frame & shrimp)", from: "bottom-side-control", to: "bottom-open-guard-kneeling", col: "transition", type: "escape", status: "draft",
      summary: "Frame on the opponent, shrimp away, and recover guard by putting your knee back in.",
      steps: [
        "Frame one forearm on the neck, the other hand on the hip.",
        "Bridge into them to lift their weight.",
        "Shrimp away to create space.",
        "Slide your knee into the gap and recover guard."
      ],
      notes: "See [[Frames]]." },
    { id: "side-control-escape-underhook", name: "Side control escape (underhook to knees)", from: "bottom-side-control", to: "standing", col: "transition", type: "escape", status: "draft",
      summary: "Bridge and win the underhook, then turn to your knees and come up into a wrestling scramble or single leg.",
      steps: [
        "Frame and bridge to lift their hips.",
        "Pummel your near arm into an underhook.",
        "Turn in toward them and come up to your knees.",
        "Drive into a single leg or stand up."
      ],
      notes: "See [[Underhook battle]]." },
    { id: "kimura-defense", name: "Kimura defense", from: "bottom-side-control", to: null, col: "defense", type: "defense", status: "draft", counters: ["kimura"],
      summary: "Grab your own belt, pants or gi to stop the arm from rotating, then reposition.",
      steps: [
        "Grab your belt or pants with the attacked hand.",
        "Keep the elbow tight to your body.",
        "Turn into them to take the angle away.",
        "Free the arm and recover guard."
      ] },
    { id: "americana-defense", name: "Americana defense", from: "bottom-side-control", to: null, col: "defense", type: "defense", status: "draft", counters: ["americana"],
      summary: "Keep the elbow from being pinned and the wrist from being slid down; straighten or turn the arm in.",
      steps: [
        "Keep your elbows close to your body, not above your head.",
        "If the wrist is pinned, straighten the arm.",
        "Turn into them to take away the angle.",
        "Bridge to break their base."
      ] },
    { id: "paper-cutter-choke-defense", name: "Paper cutter choke defense", from: "bottom-side-control", to: null, col: "defense", type: "defense", status: "draft", counters: ["paper-cutter-choke"],
      summary: "Block the deep collar grip and keep the forearm off your neck.",
      steps: [
        "Keep your far collar covered.",
        "Turn your chin toward the grip.",
        "Frame on the forearm.",
        "Escape the hips."
      ] },

    // ---- from Bottom knee on belly ----
    { id: "baseball-bat-choke-defense", name: "Baseball bat choke defense", from: "bottom-knee-on-belly", to: null, col: "defense", type: "defense", status: "draft", counters: ["baseball-bat-choke"],
      summary: "Strip one of the grips and turn with them so the choke can't close.",
      steps: [
        "Spot the two same-direction grips early.",
        "Strip the nearest hand.",
        "Turn with them as they spin.",
        "Recover guard."
      ] },

    // ---- from Bottom mount ----
    { id: "mount-escape", name: "Mount escape", from: "bottom-mount", to: "bottom-half-guard", col: "transition", type: "escape", status: "draft",
      summary: "Elbow-knee escape: make space, shrimp and pull a knee through to recover half guard." },
    { id: "upa", name: "Trap and roll (upa)", from: "bottom-mount", to: "top-closed-guard-kneeling", col: "transition", type: "escape", status: "draft",
      summary: "Mount escape: trap one arm and the foot on the same side, then bridge over that shoulder to roll the opponent.",
      steps: [
        "Trap their arm by hugging it to your chest.",
        "Trap their foot on the same side with your foot.",
        "Bridge high over the trapped shoulder.",
        "Land in their closed guard with good posture."
      ],
      notes: "Not to be confused with the [[Arm roll (turtle)]]." },
    { id: "arm-bar-defense", name: "Arm bar defense (hitchhiker)", from: "bottom-mount", to: null, col: "defense", type: "escape", status: "draft", counters: ["arm-bar-mount"],
      summary: "Rotate your thumb toward the opponent's head and turn your body so the elbow slips out.",
      steps: [
        "Clasp your hands and keep the elbow bent as long as possible.",
        "Turn the thumb to point away from them (hitchhiker).",
        "Walk your feet around toward their head.",
        "Pull the elbow out and come up on top."
      ] },
    { id: "cross-collar-choke-defense", name: "Cross collar choke defense", from: "bottom-mount", to: null, col: "defense", type: "defense", status: "draft", counters: ["cross-collar-choke"],
      summary: "Stop the second grip, then use the opponent's forward posture to escape.",
      steps: [
        "Block the second hand before it reaches your collar.",
        "Turn your chin toward the first grip.",
        "Push their elbow across your face.",
        "Use their forward weight to bridge and roll."
      ] },
    { id: "head-and-arm-choke-defense", name: "Head and arm choke defense", from: "bottom-mount", to: null, col: "defense", type: "defense", status: "draft", counters: ["head-and-arm-choke"],
      summary: "Keep your arm from being pushed across your face, or turn into them before they dismount.",
      steps: [
        "Keep your elbow down and tight.",
        "If the arm crosses, grab your own collar or head with that hand.",
        "Turn into them and make space with your shoulder.",
        "Keep them from dismounting to the side."
      ] },
    { id: "ezekiel-choke-defense", name: "Ezekiel choke defense", from: "bottom-mount", to: null, col: "defense", type: "defense", status: "draft", counters: ["ezekiel-choke"],
      summary: "Stop the hand from crossing your throat and escape while their arms are tied up.",
      steps: [
        "Tuck your chin and block the free hand.",
        "Push the choking elbow across.",
        "Bridge while their hands are busy.",
        "Elbow-knee escape."
      ] },

    // ---- from Bottom back mount ----
    { id: "back-escape", name: "Back escape", from: "bottom-back-mount", to: "top-half-guard", col: "transition", type: "escape", status: "draft",
      summary: "Protect the neck, slide your back to the mat on the side of the bottom hook, and turn in.",
      steps: [
        "Two-on-one the choking arm and keep your chin down.",
        "Slide your shoulders to the mat on the side of their bottom hook.",
        "Clear the top hook with your hand or leg.",
        "Turn in and end on top in their half guard."
      ] },
    { id: "rear-naked-choke-defense", name: "Rear naked choke defense", from: "bottom-back-mount", to: null, col: "defense", type: "defense", status: "draft", counters: ["rear-naked-choke"],
      summary: "Hand-fight the choking arm with both hands and tuck your chin.",
      steps: [
        "Chin down, shoulders up.",
        "Two-on-one the choking wrist and pull it down.",
        "Keep the arm off your neck while you escape.",
        "Move to the [[Back escape]] once the choke is clear."
      ] },
    { id: "collar-choke-defense-back", name: "Collar choke defense (back)", from: "bottom-back-mount", to: null, col: "defense", type: "defense", status: "draft", counters: ["bow-and-arrow","lapel-choke"],
      summary: "Strip the collar grip and stop the opponent getting the angle for the bow and arrow or lapel choke.",
      steps: [
        "Grab the choking hand at the wrist and pull it down.",
        "Keep your leg hidden from the pants grip.",
        "Turn toward the choking hand's side.",
        "Bring your back to the mat."
      ] },
    { id: "arm-bar-defense-back", name: "Arm bar defense (back)", from: "bottom-back-mount", to: null, col: "defense", type: "defense", status: "draft", counters: ["arm-bar-back"],
      summary: "Keep your arms tight to your body when defending chokes so they can't be isolated.",
      steps: [
        "Clasp your hands together.",
        "Keep your elbows on your ribs.",
        "Turn into the attacking side.",
        "Pull the elbow out as they fall back."
      ] },

    // ---- from Bottom turtle ----
    { id: "arm-roll-turtle", name: "Arm roll (turtle)", from: "bottom-turtle", to: "top-side-control", col: "transition", type: "sweep", status: "draft",
      summary: "From turtle, overhook the arm the top player has around you and roll to that side, taking them over you so you land on top. Wrestlers call this an arm roll; if you also grab their leg it becomes a Peterson roll.",
      steps: [
        "Wait for them to reach an arm around your waist or chest.",
        "Overhook that arm tight to your body at the elbow.",
        "Drop your shoulder on that side, tuck your head and roll toward the trapped arm.",
        "They go over you; follow through and come up chest to chest on top."
      ],
      notes: "Not the same as the mount escape [[Trap and roll (upa)]], which also uses the name \"trap and roll\"." },
    { id: "turtle-guard-recovery", name: "Turtle guard recovery", from: "bottom-turtle", to: "bottom-open-guard-kneeling", col: "transition", type: "escape", status: "draft",
      summary: "Roll or sit out from turtle to put your legs back between you and the opponent.",
      steps: [
        "Keep elbows tight to knees and the neck protected.",
        "Post on one foot toward the side they're on.",
        "Roll over your shoulder or sit through.",
        "Bring your knees in and recover guard."
      ] },
    { id: "clock-choke-defense", name: "Clock choke defense", from: "bottom-turtle", to: null, col: "defense", type: "defense", status: "draft", counters: ["clock-choke"],
      summary: "Block the collar grip, and turn or sit out toward the choke before they walk around.",
      steps: [
        "Keep your elbows tight and your collar covered.",
        "Grab the choking wrist.",
        "Turn toward the choking side as they walk.",
        "Sit out or roll to guard."
      ] },

    // ---- from Bottom north south ----
    { id: "north-south-choke-defense", name: "North south choke defense", from: "bottom-north-south", to: null, col: "defense", type: "defense", status: "draft", counters: ["north-south-choke"],
      summary: "Keep your near arm inside and turn toward the opponent so their chest can't seal your neck.",
      steps: [
        "Keep your near arm tight, elbow by your ribs.",
        "Frame on their hips.",
        "Turn into them to take the angle away.",
        "Recover guard as the pressure eases."
      ] }
  ],

  concepts: [
    // ---- concepts ----
    { id: "grip-fighting", name: "Grip fighting",
      kind: "concept",
      summary: "The battle for the grips you want and against the grips they want. Whoever controls the grips controls the exchange.",
      steps: [
        "Break grips early, before they are set.",
        "Grip with a purpose: each grip should lead to a technique.",
        "Two-on-one any grip you need to break.",
        "In no-gi, wrists, collar ties, underhooks and overhooks replace cloth grips."
      ],
      notes: "See [[Gi vs no-gi]] and [[Underhook battle]]." },
    { id: "frames", name: "Frames",
      kind: "concept",
      summary: "Using bones (forearms, shins, straight arms) instead of muscles to hold space between you and the opponent.",
      steps: [
        "Bone-to-body: forearm on the neck, hand on the hip.",
        "Frame first, then move your hips away from the frame.",
        "A frame is for making space, not for pushing.",
        "Rebuild frames as soon as one collapses."
      ],
      notes: "Key for [[Side control escape (frame & shrimp)]] and [[Guard retention (standing)]]." },
    { id: "base-and-posture", name: "Base and posture",
      kind: "concept",
      summary: "Base is how stable you are against being moved; posture is a straight spine with the head up. Losing either gets you swept or submitted.",
      steps: [
        "Wide, low base when on top.",
        "Keep your head above your hips in guard.",
        "Avoid posting hands where they can be trapped.",
        "Re-establish posture before you attack."
      ],
      notes: "See [[Top closed guard (kneeling)]] and [[Triangle defense]]." },
    { id: "pressure", name: "Pressure",
      kind: "concept",
      summary: "Putting your weight where the opponent has to carry it, so they tire and can't move their hips.",
      steps: [
        "Weight through your hips or chest, not your hands.",
        "Pin the hips and the head: that stops most movement.",
        "Stay on your toes so your weight goes into them, not the mat.",
        "Pressure first, then pass or submit."
      ],
      notes: "Pressure passes include [[Smash pass]], [[Over under pass]] and [[Double under pass]]." },
    { id: "underhook-battle", name: "Underhook battle",
      kind: "concept",
      summary: "Fighting to get your arm under the opponent's arm. The person with the underhook usually wins the position.",
      steps: [
        "Pummel: swim your arm inside theirs.",
        "Use the underhook to lift and get to your side or knees.",
        "Deny their underhook with a crossface or whizzer.",
        "Matters most in half guard and standing."
      ],
      notes: "See [[Bottom half guard]], [[Top half guard]] and [[Old school sweep]]." },
    { id: "gi-vs-nogi", name: "Gi vs no-gi",
      kind: "concept",
      summary: "The gi adds cloth grips and collar chokes; no-gi is faster, more slippery and leans more on wrestling and leg locks.",
      steps: [
        "Gi: collar chokes, lapel guards, slower and more grip-heavy.",
        "No-gi: underhooks, wrist control, front headlocks, heel hooks.",
        "Many techniques work in both with small grip changes."
      ],
      notes: "Gi-only: [[Bow and arrow]], [[Cross collar choke]], [[Bottom lapel guard (worm)]]. No-gi favourites: [[Darce choke]], [[Heel hook]]." },
    { id: "glossary", name: "Glossary",
      kind: "concept",
      summary: "Common BJJ terms used across this wiki.",
      notes: "Base — stability against being moved. See [[Base and posture]].\nCrossface — shoulder pressed across the opponent's face to turn their head away.\nFrame — a bone structure that holds space. See [[Frames]].\nHook — a foot or leg wrapped behind the opponent's leg or inside their thigh.\nKnee line — the line of the knee; whoever controls it controls leg entanglements.\nPass — getting past the opponent's legs to a pin.\nPost — a hand or foot put on the mat to stop being swept.\nSeatbelt — over-under grip from behind. See [[Seatbelt back take]].\nShrimp — hip escape, moving your hips away on your side.\nSweep — reversing from bottom guard to top.\nUnderhook — your arm under the opponent's armpit. See [[Underhook battle]].\nWhizzer — an overhook used to stop an underhook." }
  ],

  layout: [
    { cat: "positive", groups: [
      { group: "standing", positions: [
        "top-back-take-standing", "top-body-lock", "top-front-headlock"
      ] },
      { group: "post guard", positions: [
        "top-side-control", "top-side-control-kesa", "top-knee-on-belly", "top-mount",
        "top-mount-s", "top-mount-technical", "top-back-mount", "top-crucifix",
        "top-turtle", "top-north-south"
      ] }
    ]},
    { cat: "neutral", groups: [
      { group: "standing", positions: [
        "standing"
      ] },
      { group: "guard", positions: [
        "top-open-guard-standing", "bottom-open-guard-standing", "top-open-guard-kneeling", "bottom-open-guard-kneeling",
        "top-open-guard-seated", "bottom-open-guard-seated", "top-closed-guard-kneeling", "bottom-closed-guard-kneeling",
        "top-closed-guard-standing", "bottom-closed-guard-standing", "top-half-guard", "bottom-half-guard",
        "top-half-guard-knee-shield", "bottom-half-guard-knee-shield", "top-half-guard-deep", "bottom-half-guard-deep",
        "top-cccbg", "bottom-cccbg", "top-dlr", "bottom-dlr",
        "top-reverse-dlr", "bottom-reverse-dlr", "top-lasso", "bottom-lasso",
        "top-lapel-guard", "bottom-lapel-guard", "top-kguard", "bottom-kguard",
        "top-x-guard", "bottom-x-guard", "top-rubber-guard", "bottom-rubber-guard",
        "top-butterfly", "bottom-butterfly", "top-spider", "bottom-spider"
      ] },
      { group: "legs", positions: [
        "top-slx", "bottom-slx", "fifty-fifty", "top-saddle",
        "bottom-saddle"
      ] }
    ]},
    { cat: "negative", groups: [
      { group: "standing", positions: [
        "bottom-back-take-standing", "bottom-body-lock", "bottom-front-headlock"
      ] },
      { group: "post guard", positions: [
        "bottom-side-control", "bottom-side-control-kesa", "bottom-knee-on-belly", "bottom-mount",
        "bottom-mount-s", "bottom-mount-technical", "bottom-back-mount", "bottom-crucifix",
        "bottom-turtle", "bottom-north-south"
      ] }
    ]}
  ],

  aliases: {
    "standing-standing": "standing",
    "top-standing-back-take": "top-back-take-standing",
    "bottom-standing-back-take": "bottom-back-take-standing",
    "top-standing-open-guard": "top-open-guard-standing",
    "top-kneeling-open-guard": "top-open-guard-kneeling",
    "top-kneeling-closed-guard": "top-closed-guard-kneeling",
    "top-standing-closed-guard": "top-closed-guard-standing",
    "saddle": "bottom-saddle",
    "top-s-mount": "top-mount-s",
    "top-technical-mount": "top-mount-technical",
    "top-kesa-gatame": "top-side-control-kesa",
    "bottom-deep-half": "bottom-half-guard-deep",
    "bottom-z-guard": "bottom-half-guard-knee-shield",
    "bottom-seated-guard": "bottom-open-guard-seated",
    "bottom-worm-lapel": "bottom-lapel-guard",
    "standing-guard-open": "closed-guard-opening-standing",
    "slx-to-5050": "fifty-fifty-entry",
    "trap-and-roll": "arm-roll-turtle"
  },

  // Add names here to list them as red links on the Wanted pages page.
  wanted: []
};
