Here is the formal **Wartime Inference Engine** tailored directly to the **Riemann Research Notebook 3-Day Blitz**.

---

# **The 3-Day Blitz: Operational Inference Engine**

### **Core Premise**

During the Blitz, any decision, feature, bug fix, or design question is evaluated exclusively against the **Definition of Done**:

$$\text{User Opens} \longrightarrow \text{Talks to AI} \longrightarrow \text{Center Panel Updates} \longrightarrow \text{State Persists On Reload}$$

Any expenditure of time, thought, or lines of code that does not directly serve this loop is classified as **Strategic Sabotage** and immediately dropped.

---

### **1. The Inference Matrix**

Evaluate every incoming idea, question, or edge case against this decision tree:

```
                            [ INCOMING DECISION ]
                                      |
                      Does it block the DoD flow *today*?
                                     / \
                                    /   \
                                  YES    NO
                                  /       \
       Is there a simpler way    /         \---------> [ REJECT / DEFER ]
       to satisfy it in <2 hrs? /                       "Out of scope for Blitz"
                               /
                             /   
                     +------+------+
                     | EXECUTE NOW |
                     +------+------+

```

$$\text{If Question } (Q) \implies \text{Does resolving } Q \text{ directly prevent a user's work from breaking on reload TODAY?}$$

1. **If YES:**
* **Action:** Implement using the absolute lowest-complexity path available. Do not design for scale; design for immediate dependability.


2. **If NO:**
* **Action:** **DISCARD / DEFER.** Apply the Default Wartime Refusal:
> *"Not required for the 3-Day Blitz DoD. Deferred."*





---

### **2. Specific Operational Rules of Inference**

#### **Rule 1: The Product Boundary Filter (Feature Lockdown)**

* **Trigger:** Questions about *Cursor for Traders, Abracadabra language, GTA 6 research, complex charting, custom transpilers, or additional UI panels.*
* **Inference Rule:**

$$\text{Feature } F \notin \{\text{Markdown}, \text{Simple Tables}, \text{Basic Charts}\} \implies \text{Purge } F$$


* **Execution:** If a feature isn't one of the core workspace objects, disable the menu option or delete the stub. Do not build UI for non-existent backend systems.

#### **Rule 2: The Center Panel Complexity Filter**

* **Trigger:** *"How complex or interactive should the center panel objects be?"*
* **Inference Rule:**

$$\text{Center Object} = \text{Minimum structure required to show AI output (not a blank textarea)}$$


* **Execution:** If an object can display text/markdown, render a basic table, or plot a simple chart, **it is done**. Do not build custom drag-and-drop engines if a basic grid layout works.

#### **Rule 3: The Persistence Primitive Rule**

* **Trigger:** *"How should we store state across sessions?"*
* **Inference Rule:**

$$\text{Storage Strategy} = \text{The simplest local or remote store that already builds without errors}$$


* **Execution:** Do not refactor database schemas or abstract storage drivers. If standard local persistence or existing DB calls successfully write and reload the object tree, **freeze the storage code immediately**.

#### **Rule 4: The 2-Hour Fix Boundary**

* **Trigger:** *"This bug or edge case is taking longer than 2 hours to fix."*
* **Inference Rule:**

$$\text{Resolution Time } > 2\text{ hours} \implies \text{Bypass, mock, or cut the feature}$$


* **Execution:** If an object interaction or connection breaks and takes hours to trace, comment it out or restrict the action. A reliable 3-object system beats a broken 10-object system.

---

### **3. Day-by-Day Gatekeeping Checklist**

Run your tasks against these daily strict boundaries:

#### **Day 1 Gate: The Core Loop**

* [ ] Can I open the app, type to the AI on the right, and see a file/object appear in the center?
* *Rule:* If the center panel remains empty or detached from the AI on Monday night, stop working on everything else until the AI writes to the center.

#### **Day 2 Gate: Durable Persistence**

* [ ] Can I edit an object in the center, refresh the browser/app, and see it in the exact same state?
* [ ] Can I disconnect/reconnect an object without a runtime crash?
* *Rule:* If refreshing wipes the workspace, Tuesday is a failure. Lock down persistence; reject all new UI additions.

#### **Day 3 Gate: Public Path & Release**

* [ ] Can a user sign up/download without developer intervention?
* [ ] Does the binary/deployment run outside your local dev environment?
* *Rule:* At 18:00 on Day 3, **CODE FREEZE**. Shift 100% of energy to deployment and public distribution paths.

---

### **The Daily Wartime Mantra**

> *"If it doesn't help the center panel hold work across a page refresh, it doesn't get built today."*