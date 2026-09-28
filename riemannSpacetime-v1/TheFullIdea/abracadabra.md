
For example, a tiny Space-time Program could look like:

```text
world Hospital

entity Doctor
  role = doctor

entity Patient
  status = waiting

event request_approval
  actor = Doctor
  target = Patient

transition request_approval
  when actor.role == doctor
  then Patient.status = approved
```

The important distinction is:

```text
SPACE-TIME MACHINE
= fixed runtime

SPACE-TIME PROGRAM
= the particular world + its rules
```

So you could load:

```text
hospital.st
game.st
research.st
company.st
```

into the same Machine.

The Machine stays the same.

The Space-time Program changes what world exists and what that world is allowed to do.

## Prompt:
9/26/2026, 11:59:38 AM

So abracadabra compiles down to a spacetime program?

## Response:
9/26/2026, 11:59:39 AM

Yes.

That is the clean architecture:

```text
Abracadabra
    ↓
compiler
    ↓
Space-time Program
    ↓
Space-time Machine
    ↓
running Space-time
```

Abracadabra is what humans/AI write to describe the world and its behavior.

The compiler turns that into the machine-readable Space-time Program containing the entities, relationships, events, transitions, permissions, rules, capabilities, and so on.

Then the Space-time Machine executes that program.

So:

**Abracadabra = language**  
**Space-time Program = compiled world**  
**Space-time Machine = runtime**  
**Theme = presentation**  
**UI = interaction**  

That gives you a very clean separation between the language, the world, the machine, and the appearance.

## Prompt:
9/26/2026, 12:02:39 PM

Now it also needs to have variables, functions, sets, arrays, etc registered into it for the persistent world that is since the variables are borrowed ... or does it need it in the db?

## Response:
9/26/2026, 12:02:42 PM

Yes. The important distinction is between what the Space-time Program defines and what the running Space-time persists.

I would make it:

```text
Abracadabra
   ↓
compiled Space-time Program
   ├── types
   ├── variables
   ├── functions
   ├── sets
   ├── arrays
   ├── entities
   ├── events
   ├── transitions
   ├── rules
   └── permissions
          ↓
Space-time Machine
          ↓
persistent World State
          ↓
DB / storage
```