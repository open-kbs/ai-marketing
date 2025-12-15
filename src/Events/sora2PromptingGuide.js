// Sora 2 Prompting Guide - Complete reference for video generation
export const getSora2PromptingGuide = () => ({
    type: 'SORA2_PROMPTING_GUIDE',
    data: {
        // Core Philosophy
        before_you_prompt: `Think of prompting like briefing a cinematographer who has never seen your storyboard. If you leave out details, they'll improvise – and you may not get what you envisioned. By being specific about what the "shot" should achieve, you give the model more control and consistency to work with.

But leaving some details open can be just as powerful. Giving the model more creative freedom can lead to surprising variations and unexpected, beautiful interpretations. Both approaches are valid: detailed prompts give you control and consistency, while lighter prompts open space for creative outcomes.

Treat your prompt as a creative wish list, not a contract. Using the same prompt multiple times will lead to different results – this is a feature, not a bug. Each generation is a fresh take, and sometimes the second or third option is better.`,

        // API Parameters (Non-Negotiable)
        api_parameters: {
            important: "These MUST be set explicitly in API call, NOT in prose:",
            model: {
                options: ["sora-2", "sora-2-pro"]
            },
            size: {
                "sora-2": ["1280x720", "720x1280"],
                "sora-2-pro": ["1280x720", "720x1280", "1024x1792", "1792x1024"],
                note: "Resolution directly influences visual fidelity and motion consistency"
            },
            seconds: {
                options: ["4", "8", "12"],
                default: "4",
                tip: "Shorter clips follow instructions more reliably. Consider 2x4s instead of 1x8s"
            }
        },

        // Prompt Anatomy
        prompt_anatomy: {
            description: "A clear prompt describes a shot as if you were sketching it onto a storyboard",

            what_works: [
                "State the camera framing",
                "Note depth of field",
                "Describe action in beats",
                "Set lighting and palette",
                "Anchor subject with distinctive details",
                "Keep to single, plausible action"
            ],

            length_guidance: {
                short: "Gives model creative freedom, expect surprising results",
                detailed: "Restricts creativity but provides more control"
            },

            example_short: {
                prompt: "In a 90s documentary-style interview, an old Swedish man sits in a study and says, 'I still remember when I was young.'",
                why_it_works: [
                    "90s documentary sets style - model chooses lens, lighting, color grade",
                    "Basic subject/setting lets model take creative liberties",
                    "Simple dialogue that Sora can follow exactly"
                ]
            }
        },

        // Visual Cues
        visual_cues: {
            style_power: "Style is one of the most powerful levers for guiding the model. Establish early (e.g., '1970s film', 'IMAX-scale', '16mm black-and-white')",

            clarity_wins: "Instead of vague cues, use specific visuals",

            weak_vs_strong: [
                {
                    category: "Visual Details",
                    weak: "A beautiful street at night",
                    strong: "Wet asphalt, zebra crosswalk, neon signs reflecting in puddles"
                },
                {
                    category: "Movement",
                    weak: "Person moves quickly",
                    strong: "Cyclist pedals three times, brakes, and stops at crosswalk"
                },
                {
                    category: "Camera Style",
                    weak: "Cinematic look",
                    strong: "Anamorphic 2.0x lens, shallow DOF, volumetric light"
                },
                {
                    category: "Lighting",
                    weak: "Brightly lit room",
                    strong: "Soft window light with warm lamp fill, cool rim from hallway"
                }
            ],

            camera_framing_examples: [
                "wide establishing shot, eye level",
                "wide shot, tracking left to right with the charge",
                "aerial wide shot, slight downward angle",
                "medium close-up shot, slight angle from behind"
            ],

            camera_motion_examples: [
                "slowly tilting camera",
                "handheld eng camera",
                "slow dolly-in from eye level",
                "shoulder-mounted slow dolly left",
                "slow arc in"
            ]
        },

        // Motion and Timing Control
        motion_timing: {
            principle: "Movement is often the hardest part to get right, so keep it simple",

            rule: "Each shot should have ONE clear camera move and ONE clear subject action",

            beats_approach: "Actions work best when described in beats or counts",

            examples: {
                weak: "Actor walks across the room",
                strong: "Actor takes four steps to the window, pauses, and pulls the curtain in the final second"
            }
        },

        // Lighting and Color
        lighting_color: {
            importance: "Light determines mood as much as action or setting",

            consistency: "Keeping lighting logic consistent is what makes the edit seamless",

            description_approach: "Describe both quality of light and color anchors",

            examples: {
                weak: {
                    lighting: "brightly lit room"
                },
                strong: {
                    lighting: "soft window light with warm lamp fill, cool rim from hallway",
                    palette: "amber, cream, walnut brown"
                }
            },

            tip: "Naming 3-5 colors helps keep palette stable across shots"
        },

        // Image Input
        image_input: {
            purpose: "Use photos, digital artwork or AI generated visuals to lock composition and style",

            how_it_works: "Model uses image as anchor for first frame, text defines what happens next",

            requirements: [
                "Include as input_reference parameter",
                "Image MUST match target video resolution",
                "Supported formats: image/jpeg, image/png, image/webp"
            ],

            experimentation_tip: "Use OpenAI's image generation to create references, then pass to Sora"
        },

        // Dialogue and Audio
        dialogue_audio: {
            placement: "Place dialogue in block below prose description",

            guidelines: [
                "Keep lines concise and natural",
                "Limit exchanges to match clip length",
                "Label speakers consistently",
                "Use alternating turns for multi-character scenes"
            ],

            timing: {
                "4_seconds": "1-2 short exchanges",
                "8_seconds": "A few more exchanges possible"
            },

            sound_cues: "For silent shots, suggest pacing with small sound like 'distant traffic hiss' or 'crisp snap'",

            example: `A cramped, windowless room with walls the color of old ash...
Dialogue:
- Detective: "You're lying. I can hear it in your silence."
- Suspect: "Or maybe I'm just tired of talking."
- Detective: "Either way, you'll talk before the night's over."`
        },

        // Remix Functionality
        remix: {
            philosophy: "Remix is for nudging, not gambling",

            approach: "Make controlled changes – ONE at a time",

            examples: [
                "same shot, switch to 85mm",
                "same lighting, new palette: teal, sand, rust",
                "same composition, change monster color to orange"
            ],

            troubleshooting: "If shot keeps misfiring, strip back: freeze camera, simplify action, clear background"
        },

        // Ultra-Detailed Approach
        ultra_detailed: {
            when_to_use: "For complex, cinematic shots matching real cinematography styles",

            components: [
                "Format & Look (shutter, capture format, grain)",
                "Lenses & Filtration (specific mm, filters)",
                "Grade/Palette (highlights, mids, blacks)",
                "Lighting & Atmosphere (natural/practical sources)",
                "Location & Framing (foreground/midground/background)",
                "Wardrobe/Props/Extras",
                "Sound (diegetic only)",
                "Camera Notes (eyeline, flares, imperfections)"
            ],

            example_snippet: `Format & Look: Duration 4s; 180° shutter; digital capture emulating 65mm photochemical contrast; fine grain; subtle halation on speculars
Lenses: 32mm/50mm spherical primes; Black Pro-Mist 1/4
Grade: Highlights - clean morning sunlight with amber lift; Mids - balanced neutrals with slight teal cast`
        },

        // Templates
        templates: {
            descriptive: `[Prose scene description in plain language]

Cinematography:
Camera shot: [framing and angle]
Mood: [overall tone]

Actions:
- [Action 1: clear specific beat]
- [Action 2: distinct beat]
- [Action 3: action or dialogue]

Dialogue:
[If applicable, brief natural lines]`,

            structured_example: `Style: Hand-painted 2D/3D hybrid animation with soft brush textures
Inside a cluttered workshop, shelves overflow with gears...

Cinematography:
Camera: medium close-up, slow push-in
Lens: 35mm virtual lens, shallow DOF
Mood: gentle, whimsical, touch of suspense

Actions:
- Robot taps bulb; sparks crackle
- It flinches, dropping bulb, eyes widening
- Bulb tumbles in slow motion; catches it just in time
- Robot says quietly: "Almost lost it... but I got it!"`
        },

        // Key Insights
        key_insights: [
            "The right prompt balance depends on whether you prioritize consistency or creative surprise",
            "Small changes to camera, lighting, or action can shift outcome dramatically",
            "Collaborate with the model: you provide direction, model delivers variations",
            "This isn't exact science – treat guidance as helpful suggestions",
            "Be prepared to iterate"
        ]
    }
});