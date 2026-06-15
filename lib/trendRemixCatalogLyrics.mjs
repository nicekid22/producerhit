/**
 * Original full-song lyrics per trend remix catalog entry (verse + chorus, no placeholders).
 * Used as ACE input — inspired by mood/theme, not copyrighted originals.
 */

/** @type {Record<string, string>} */
export const TREND_REMIX_CATALOG_LYRICS = {
  "die-with-a-smile": `[Verse 1]
Hold my hand when the night gets heavy
Laugh through tears till the sky turns steady
If the world goes quiet, stay right beside me

[Chorus]
I'd die with a smile if you're holding on
Every storm we weather makes our love more strong
Till the last light fades, we'll face it side by side

[Verse 2]
Golden hours, coffee getting cold
Stories written in the lines we hold
Say you'll never leave me in the dark alone

[Chorus]
I'd die with a smile if you're holding on
Every storm we weather makes our love more strong
Till the last light fades, we'll face it side by side`,

  "birds-of-a-feather": `[Verse 1]
Locked in your orbit, midnight on repeat
Secrets in whispers, heartbeat to heartbeat
If they try to pull us, we won't drift apart

[Chorus]
Birds of a feather, we ride till the end
No one else gets the language that we bend
In your shadow, in your light, I'm where I belong

[Verse 2]
Cold city windows, fog on the glass
Every little fracture, you help it pass
Say my name like armor when the world gets hard

[Chorus]
Birds of a feather, we ride till the end
No one else gets the language that we bend
In your shadow, in your light, I'm where I belong`,

  apt: `[Verse 1]
Game on, game on, you already know the rules
One look from you and I lose my cool
Call it playful, call it bold, we run the night

[Chorus]
A P T, say it back to me
Flirty fire, call-and-response energy
Hands up, don't stop, we go again

[Verse 2]
Neon reflections dancing on your face
Every little challenge turns into a chase
If you want the last word, you can have it too

[Chorus]
A P T, say it back to me
Flirty fire, call-and-response energy
Hands up, don't stop, we go again`,

  "beautiful-things": `[Verse 1]
Morning light on a fragile dream
Scared to blink in case you leave
Every perfect moment feels too good to keep

[Chorus]
Beautiful things don't always stay
So I hold you closer every day
Grateful for the now, afraid of yesterday

[Verse 2]
Voice mail full of words I never sent
Every compliment I second-guess
Tell me this is real and not a passing phase

[Chorus]
Beautiful things don't always stay
So I hold you closer every day
Grateful for the now, afraid of yesterday`,

  "lose-control": `[Verse 1]
You got me spinning, can't slow down
Thoughts of you are all around
Every time I try to leave, you pull me back

[Chorus]
I lose control when you walk in the room
Heartbeat racing, caught up in your groove
Can't pretend I'm cool, you know it's true

[Verse 2]
Late night messages, can't sleep again
Your name on repeat inside my head
One more touch and I forget what I planned

[Chorus]
I lose control when you walk in the room
Heartbeat racing, caught up in your groove
Can't pretend I'm cool, you know it's true`,

  espresso: `[Verse 1]
Up all night, no sleep, just attitude
Confidence in every move I choose
If you want a taste, you better come correct

[Chorus]
I'm espresso, bold and sweet, keep you up till dawn
Flirty little fire, play it like a song
Say my name slow, I'll make you want more

[Verse 2]
Sass in my step, smile sharp as glass
Every conversation, I let the moment last
If you can't handle heat, stay out the kitchen

[Chorus]
I'm espresso, bold and sweet, keep you up till dawn
Flirty little fire, play it like a song
Say my name slow, I'll make you want more`,

  greedy: `[Verse 1]
I know what I'm worth, won't settle for less
Desire on my lips, confidence on my chest
If you want my time, you pay in respect

[Chorus]
Call me greedy, I want it all tonight
Self-assured, burning bright under city lights
If you can't keep up, don't waste my line

[Verse 2]
Mirror talk, sharp attitude, no apologies
Every boundary drawn is a policy
I choose what I give, I choose what I keep

[Chorus]
Call me greedy, I want it all tonight
Self-assured, burning bright under city lights
If you can't keep up, don't waste my line`,

  "stick-season": `[Verse 1]
Maple roads and muddy boots out in the yard
Every burned-out summer left us bent and scarred
I still hear your voice when November starts

[Chorus]
Oh it's stick season, cold air in my lungs
Every song I sing sounds like the place I'm from
If love was easy, I would never learn to run

[Verse 2]
Polaroids and porch lights, promises we made
Tried to leave the hometown, ghosts still in the shade
Small-town heartbreak follows where I go

[Chorus]
Oh it's stick season, cold air in my lungs
Every song I sing sounds like the place I'm from
If love was easy, I would never learn to run`,
};

export function catalogLyricsById(id) {
  return TREND_REMIX_CATALOG_LYRICS[id] ?? "";
}
