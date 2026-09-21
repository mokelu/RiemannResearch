Here is the rule of inference formulated for your operational framework.

---

### **Rule of Engagement: The 72-Hour Scope Gate**

#### **Premise**

During recovery or wartime execution, any cognitive load spent evaluating outcomes beyond the immediate execution window (72 hours) directly degrades current operational capacity and induces execution paralysis.

#### **Inference Matrix**

$$\text{If Question } (Q) \implies \text{Does } Q \text{ directly produce a shippable output within 72 hours?}$$

1. **If YES:**
* **Classification:** *Wartime Execution Task*
* **Action:** Resolve immediately with the simplest, lowest-friction solution available. Ship it.


2. **If NO:**
* **Classification:** *Peacetime Procrastination / Strategic Drift*
* **Action:** **DISCARD / DEFER IMMEDIATELY.** Apply the default response:
> *"Out of scope for the current 72-hour window. Re-evaluate only after the active build is live."*





---

### **Operational Directives for Handling Out-of-Scope Questions**

1. **The January/Future Projection Trap**
* *Trigger:* "Where will we be in $N$ months?" / "What happens if we scale to $X$ users?"
* *Rule:* **Zero allocation.** You do not solve scale problems for a product that has no live users today.


2. **The Unbound Feature Trap**
* *Trigger:* "What should go in panel $X$?" / "Should we add $Y$ integration?"
* *Rule:* **Default to Minimum Viable State.** If an element is not required to deliver the core hook (the 10M credit grant notebook), fill it with a static placeholder or standard Markdown editor and move on.


3. **The Architectural Polish Trap**
* *Trigger:* "Should we refactor the data layer / storage driver / abstraction first?"
* *Rule:* **Freeze codebase state.** Use current working code. Refactoring during wartime is strategic avoidance.



---

### **The Decision Checklist (Run on every question or idea)**

* [ ] **Can it be deployed to production before Thursday?**
* [ ] **Does it directly block a user from claiming 10M credits?**
* [ ] **Does it directly block sending cold outreach to directories/communities today?**

*If you answer **NO** to any of these three, drop the question immediately and return to the active build.*