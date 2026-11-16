# NIE Nexus — Welcome and Specialist Chat Update

This update starts from CampusPulse_Five_Specialist_Chatboxes_b5da704a.zip. The database and existing project records supplied in that archive are preserved.

## Start
Requires Node.js 26 or later. Extract the ZIP, open CampusPulse_Local and run npm start. Dependencies are included from the supplied archive; run npm install if they need to be restored. Open http://localhost:3000. Existing account credentials remain unchanged.

To upgrade a running copy, back up campuspulse.db first, replace application files while keeping your current database and private .env file, then restart the server. New specialist conversations use an additive specialist_messages table. Previous specialist history remains stored in the earlier tables, while the rebuilt workspace starts its own conversations.

## Welcome page
The cropped Technieks picture has been removed from the first welcome screen. A complete campus illustration, revised headline, clearer calls to action, balanced spacing and responsive styling replace it. Existing event banners inside the dashboard remain available. Student sign-up, sign-in, published events and the other dashboard workflows are retained.

## Worker specialists
Workers have five specialists: Venue Agent, Budget Agent, Schedule Agent, Participant Agent and Communication Agent. Open AI Specialists, choose a specialist and type a message. There are no prefilled questions, question lists or provider controls. Workers use the five-specialist workspace instead of the previous general-assistant shortcut. Organizer and Admin specialist access remains available.

Each conversation is separate for the account, selected event, event revision and agent. General guidance is available without an event assignment. For recorded event facts, workers must select an assigned, fully approved event; organizers can select their own approved events and Admin can select approved events.

Coverage:
- Venue: 50 topics, 211 question variants.
- Budget: 50 topics, 211 question variants.
- Schedule: 50 topics, 204 question variants.
- Participant: 50 topics, 206 question variants.
- Communication: 50 topics, 203 question variants.

The knowledge files are in knowledge/. The matcher supports common abbreviations, spelling correction, fragments, question variations and specialist routing. A question belonging to another specialist directs the user to that agent. Mixed topics are split or referred, and unclear questions request detail rather than a guessed answer. Arbitrary incomplete text cannot always be identified accurately.

Recorded venue, capacity, event date/time, budget, fee, aggregate registrations and the worker's own duties/earnings can be included in answers. Participant names and other workers' private pay records are not disclosed. Drafts are not sent; approvals, reservations, purchases and payment records are not created through chat. Official controls remain with Organizer and Admin.

## Verification
Run npm test.

Checks cover all 1,035 saved questions and their cross-agent redirects (5,175 combinations), 40 curated misspelling/fragment cases, 956 generated character-deletion cases, unknown/mixed questions and safe context substitution. In the deletion test, 929 matched the intended topic and 27 requested clarification; none selected a different topic in that test set.

Service tests use real Express, session handling, password verification and SQLite with in-process request streams and isolated test data. They cover authentication, student-role rejection, event assignment/ownership, approval gates, separate histories, revision isolation, message limits and personal earnings. They do not modify the supplied database. Interface checks cover the hero replacement, five selectors, empty composer and absence of old provider controls.

The welcome page was visually checked in Chrome at desktop and narrow window sizes using a separate interface fixture. Full worker-chat browser verification remains pending; the worker interface is covered by rendering and service checks. Matcher-only measurements on the test machine were approximately 1 ms at the 95th percentile for the short warmed-up test set; this does not guarantee end-to-end latency on other machines.
