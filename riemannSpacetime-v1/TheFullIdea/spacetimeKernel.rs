use std::collections::{HashMap, HashSet};

// ============================================================
// 1. CAPABILITY
// ============================================================

#[derive(Debug, Clone, Hash, Eq, PartialEq)]
pub struct CapabilityToken(u64);

// ============================================================
// 2. EVENTS
// ============================================================

#[derive(Debug, Clone)]
pub struct Event {
    pub caller_id: String,
    pub subject: String,
    pub event_type: String,
    pub token: CapabilityToken,
}

// ============================================================
// 3. COMPILED SPACE-TIME PROGRAM
//    This is the machine-readable form of Symphony.
//    It is stored IN SPACE-TIME, not inside the kernel.
// ============================================================

#[derive(Debug, Clone)]
pub struct Rule {
    pub subject: String,
    pub event_type: String,
    pub instruction: Instruction,
}

#[derive(Debug, Clone)]
pub enum Instruction {
    Set {
        variable: String,
        value: String,
    },

    Increment {
        variable: String,
        amount: u64,
    },

    Tell {
        target: String,
        message: String,
    },
}

#[derive(Debug, Clone, Default)]
pub struct SpaceTimeProgram {
    pub rules: Vec<Rule>,
}

// ============================================================
// 4. WORLD STATE
// ============================================================

#[derive(Debug, Clone, Default)]
pub struct WorldState {
    pub variables: HashMap<String, String>,
}

// ============================================================
// 5. SPACE-TIME
//    The persistent world.
//    State + program + history + capabilities live here.
// ============================================================

pub struct SpaceTime {
    pub state: WorldState,
    pub program: SpaceTimeProgram,
    pub history: Vec<Event>,
    capabilities: HashSet<CapabilityToken>,
}

// ============================================================
// 6. SPACE-TIME KERNEL
//
//    The kernel itself contains NO application rules.
//
//    It only knows how to:
//      - receive an event
//      - check authority
//      - find a matching rule
//      - execute the compiled instruction
//      - record the event
// ============================================================

pub struct SpaceTimeKernel;

impl SpaceTimeKernel {
    pub fn dispatch(
        &self,
        world: &mut SpaceTime,
        event: Event,
    ) -> Result<WorldState, String> {
        // 1. Authority
        if !world.capabilities.contains(&event.token) {
            return Err(format!(
                "REJECTED: '{}' does not have the required capability.",
                event.caller_id
            ));
        }

        // 2. Find a rule in the Space-Time Program
        let rule = world
            .program
            .rules
            .iter()
            .find(|rule| {
                rule.subject == event.subject
                    && rule.event_type == event.event_type
            })
            .cloned();

        let rule = match rule {
            Some(rule) => rule,
            None => {
                return Err(format!(
                    "NO RULE: Nothing in the Space-Time Program matches '{}:{}'.",
                    event.subject, event.event_type
                ));
            }
        };

        // 3. Execute the compiled instruction
        match rule.instruction {
            Instruction::Set { variable, value } => {
                world.state.variables.insert(variable, value);
            }

            Instruction::Increment { variable, amount } => {
                let current = world
                    .state
                    .variables
                    .get(&variable)
                    .and_then(|v| v.parse::<u64>().ok())
                    .unwrap_or(0);

                world
                    .state
                    .variables
                    .insert(variable, (current + amount).to_string());
            }

            Instruction::Tell { target, message } => {
                println!(
                    "[Kernel] Tell '{}' -> {}",
                    target, message
                );
            }
        }

        // 4. Record event
        world.history.push(event);

        // 5. Return current world state
        Ok(world.state.clone())
    }
}